import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { ethers, EventLog } from 'ethers';
import { Queue } from 'bullmq';
import { Cron } from '@nestjs/schedule';
import { Web3Service } from '../../web3/web3.service';
import { AllConfigType } from '../../config/config.type';
import { IWeb3Config } from '../../config/app-config.type';
import {
  CRON_DURATION,
  MILLI_SECS_PER_SEC,
  ONE_MONTH_BLOCK_RANGE,
} from '../../utils/const';
import { BlockRange, IBatch } from '../../utils/types/common.type';
import { RequestRewardsService } from '../../request-rewards/request-rewards.service';
import { formatEtherNumber, formatTimestamp } from '../../utils/helper';
import { CreateRequestRewardDto } from '../../request-rewards/dto/create-request-reward.dto';
import { QueryType } from '../../utils/common.type';
import { CheckpointsService } from '../../checkpoints/checkpoints.service';

@Injectable()
export class ReqRewardFetchService implements OnModuleInit {
  private provider: ethers.Provider;
  private logger = new Logger(ReqRewardFetchService.name);
  private newestBlock: number = 0;
  private web3Config: IWeb3Config | undefined;
  private hasInitDone: boolean = false;
  constructor(
    private readonly web3Service: Web3Service,
    private readonly configService: ConfigService<AllConfigType>,
    private readonly requestRewardService: RequestRewardsService,
    private readonly checkpointsService: CheckpointsService,
    @InjectQueue('blockchain-index-event') private readonly queue: Queue,
  ) {
    this.provider = web3Service.getProvider();
    this.web3Config = this.configService.get('app.web3Config', {
      infer: true,
    });
  }

  async onModuleInit(): Promise<void> {
    await this.handleQueryBlocks();
  }

  @Cron(CRON_DURATION.EVERY_3_MINUTES)
  async handleCron() {
    if (!this.hasInitDone) {
      return;
    }
    await this.handleQueryBlocks();
  }

  updateHasInitDone(isDone: boolean) {
    this.hasInitDone = isDone;
  }

  async handleQueryBlocks() {
    const queryBlocks = {
      fromBlock: 0,
      toBlock: 0,
    };

    this.newestBlock = await this.web3Service.getCurrentBlock();
    this.logger.log(`Newest on chain block: ${this.newestBlock}`);
    const latestCheckpoint = await this.checkpointsService.findLatestCheckpoint(
      QueryType.FETCH_REQUEST_REWARD,
    );

    if (!latestCheckpoint) {
      this.logger.warn(
        'No latest request reward checkpoint found, start fetching from genesis`',
      );

      const fetchFromMonthAgo = this.web3Config?.initDataDuration || 3; //month
      let fromBlock =
        this.newestBlock - fetchFromMonthAgo * ONE_MONTH_BLOCK_RANGE;
      fromBlock = Math.max(fromBlock, 0);

      queryBlocks.fromBlock = fromBlock;
      queryBlocks.toBlock = this.newestBlock;
    } else {
      const latestBlockNumber = Number(latestCheckpoint.blockNumber);
      if (!isNaN(latestBlockNumber) && latestBlockNumber >= 0) {
        queryBlocks.fromBlock = latestBlockNumber + 1;
      }
      queryBlocks.toBlock = this.newestBlock;
    }

    await this.queue.add('fetch-req-reward', {
      type: 'fetch-req-reward',
      fromBlock: queryBlocks.fromBlock,
      toBlock: queryBlocks.toBlock,
    });
  }

  async fetchReqRewardEvents(
    fromBlock: number,
    toBlock: number,
  ): Promise<void> {
    try {
      this.validateBlockRange(fromBlock, toBlock);

      this.logger.log(
        `Fetching req reward events from block ${fromBlock} to ${toBlock}`,
      );

      const monthlyRanges = this.splitIntoMonthlyRanges(fromBlock, toBlock);
      const allEvents = await this.queryMonthlyRanges(monthlyRanges);

      this.logger.log(`Successfully fetched ${allEvents.length} events`);
      await this.logEvents(allEvents);
      await this.checkpointsService.saveLatestCheckpoint(
        toBlock,
        QueryType.FETCH_REQUEST_REWARD,
      );
      if (!this.hasInitDone) {
        this.updateHasInitDone(true);
      }
    } catch (error) {
      throw error;
    }
  }

  private validateBlockRange(fromBlock: number, toBlock: number): void {
    if (fromBlock < 0 || toBlock < 0) {
      throw new Error('Block numbers must be non-negative');
    }
    if (fromBlock > toBlock) {
      throw new Error('From block must be less than or equal to to block');
    }
  }

  private splitIntoMonthlyRanges(
    fromBlock: number,
    toBlock: number,
  ): BlockRange[] {
    const ranges: BlockRange[] = [];

    for (
      let current = fromBlock;
      current < toBlock;
      current += ONE_MONTH_BLOCK_RANGE
    ) {
      const rangeEnd = Math.min(current + ONE_MONTH_BLOCK_RANGE - 1, toBlock);
      ranges.push({ from: current, to: rangeEnd });
    }

    return ranges;
  }

  private async queryMonthlyRanges(
    monthlyRanges: BlockRange[],
  ): Promise<EventLog[]> {
    const allEvents: EventLog[] = [];

    for (const range of monthlyRanges) {
      try {
        const events = await this.executeRangeQuery(range);
        allEvents.push(...events);

        // Prevent rate limit among requests
        await this.delay(MILLI_SECS_PER_SEC);
      } catch (error) {
        throw error;
      }
    }

    return allEvents;
  }

  private async executeRangeQuery(range: BlockRange): Promise<EventLog[]> {
    const batches = this.createBatches(range.from, range.to);
    const promises = batches.map((batch) => {
      return this.web3Service.fetchReqReward(batch.from, batch.to);
    });

    const batchResults = await Promise.all(promises);
    return batchResults.flat() as EventLog[];
  }

  private createBatches(fromBlock: number, toBlock: number): IBatch[] {
    const maxBlockRange = this.web3Config?.maxQueryBlockRange || 10000;
    const batches: IBatch[] = [];

    for (
      let current = fromBlock;
      current <= toBlock;
      current += maxBlockRange
    ) {
      const batchEnd = Math.min(current + maxBlockRange - 1, toBlock);
      batches.push({ from: current, to: batchEnd });
    }

    return batches;
  }

  private async logEvents(events: EventLog[]): Promise<void> {
    if (!Array.isArray(events) || events.length === 0) {
      this.logger.log('No request reward events found');
      return;
    }

    this.logger.log(`Processing ${events.length} request reward events`);

    for (const event of events) {
      try {
        await this.processRequestRewardEvent(event);
      } catch (error) {
        throw error;
      }
    }

    this.logger.log('Finished processing request reward events');
  }

  private async processRequestRewardEvent(event: EventLog): Promise<void> {
    const [contributorAddress, fileId, proofIndex, rewardAmount] = event.args;

    if (!contributorAddress || !fileId || !proofIndex || !rewardAmount) {
      this.logger.warn(
        `Invalid event args for transaction ${event.transactionHash}`,
      );
      return;
    }

    const block = await this.provider.getBlock(event.blockNumber);
    const timestamp = block?.timestamp || 0;

    const requestRewardEvent: CreateRequestRewardDto = {
      txHash: event.transactionHash,
      contributorAddress: contributorAddress,
      fileId: String(Number(fileId)),
      proofIndex: String(Number(proofIndex)),
      rewardAmount: formatEtherNumber(rewardAmount),
      blockNumber: String(event.blockNumber),
      blockTimestamp: formatTimestamp(BigInt(timestamp)),
    };

    await this.requestRewardService.create(requestRewardEvent);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
