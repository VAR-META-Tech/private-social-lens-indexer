import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventLog, ethers } from 'ethers';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Cron } from '@nestjs/schedule';
import { Web3Service } from '../../web3/web3.service';
import { AllConfigType } from '../../config/config.type';
import { IWeb3Config } from '../../config/app-config.type';
import { UnstakingEventsService } from '../../unstaking-events/unstaking-events.service';
import { formatEtherNumber, formatTimestamp } from '../../utils/helper';
import {
  CRON_DURATION,
  MILLI_SECS_PER_SEC,
  ONE_MONTH_BLOCK_RANGE,
  ONE_WEEK_BLOCK_RANGE,
  WORKER_MODE,
} from '../../utils/const';
import { BlockRange, IBatch } from '../../utils/types/common.type';
import { CheckpointsService } from '../../checkpoints/checkpoints.service';
import { QueryType } from '../../utils/common.type';

@Injectable()
export class UnstakingFetchService implements OnModuleInit {
  private readonly logger = new Logger(UnstakingFetchService.name);
  private newestBlock: number = 0;
  private web3Config: IWeb3Config | undefined;
  private provider: ethers.Provider;

  constructor(
    private readonly web3Service: Web3Service,
    private readonly configService: ConfigService<AllConfigType>,
    private readonly unstakingEventsService: UnstakingEventsService,
    private readonly checkpointsService: CheckpointsService,
    @InjectQueue('blockchain-index-event') private readonly queue: Queue,
  ) {
    this.web3Config = this.configService.get('app.web3Config', {
      infer: true,
    });
    this.provider = this.web3Service.getProvider();
  }

  async onModuleInit() {
    const isCrawlMode = this.web3Config?.workerMode === WORKER_MODE.CRAWL;

    if (!isCrawlMode) {
      this.logger.log('This is not crawl mode, skipping');
      return;
    }

    await this.handleQueryBlocks();
  }

  @Cron(CRON_DURATION.EVERY_3_MINUTES)
  async handleCron() {
    const isListenMode = this.web3Config?.workerMode === WORKER_MODE.LISTEN;

    if (!isListenMode) {
      this.logger.log('This is not listen mode, skipping');
      return;
    }

    await this.handleQueryBlocks();
  }

  async handleQueryBlocks() {
    await this.processFailedCheckpoints();

    const queryBlocks = {
      fromBlock: 0,
      toBlock: 0,
    };

    try {
      this.newestBlock = await this.web3Service.getCurrentBlock();
      this.logger.log(`Newest on chain block: ${this.newestBlock}`);
      const latestCheckpoint =
        await this.checkpointsService.findLatestCheckpoint(
          QueryType.FETCH_UNSTAKING,
        );
      if (!latestCheckpoint) {
        this.logger.warn(
          'No latest unstake checkpoint found, start fetching from genesis`',
        );

        const fetchFromMonthAgo = this.web3Config?.initDataDuration || 12; //month
        let fromBlock =
          this.newestBlock - fetchFromMonthAgo * ONE_MONTH_BLOCK_RANGE;
        fromBlock = Math.max(fromBlock, 0);

        queryBlocks.fromBlock = fromBlock;
        queryBlocks.toBlock = this.newestBlock;
      } else {
        const latestBlockNumber = Number(latestCheckpoint.toBlockNumber);
        queryBlocks.fromBlock = latestBlockNumber + 1;
        queryBlocks.toBlock = this.newestBlock;
      }

      if (queryBlocks.fromBlock > queryBlocks.toBlock) {
        this.logger.log('No new blocks to fetch, skipping');
        return;
      }

      await this.fetchUnstakingEvents(
        queryBlocks.fromBlock,
        queryBlocks.toBlock,
      );
    } catch (error) {
      this.logger.error('Failed to handle query blocks', error);
      throw error;
    }
  }

  async processFailedCheckpoints() {
    try {
      const failedCheckpoints =
        await this.checkpointsService.findFailedCheckpoints(
          QueryType.FETCH_UNSTAKING,
        );

      if (failedCheckpoints.length === 0) {
        this.logger.log('No unstaking failed checkpoints found, skipping...');
        return;
      }

      const failedRanges: BlockRange[] = [];

      for (const checkpoint of failedCheckpoints) {
        const latestBlockNumber =
          await this.unstakingEventsService.getLatestUnstakeBlockNumberInRange(
            Number(checkpoint.fromBlockNumber),
            Number(checkpoint.toBlockNumber),
          );

        if (!latestBlockNumber) {
          this.logger.log(
            `refetch unstaking from ${checkpoint.fromBlockNumber} to ${checkpoint.toBlockNumber}`,
          );
          failedRanges.push({
            from: Number(checkpoint.fromBlockNumber),
            to: Number(checkpoint.toBlockNumber),
            checkpointId: checkpoint.id,
          });
          continue;
        }

        if (latestBlockNumber >= Number(checkpoint.toBlockNumber)) {
          this.logger.log(`invalid failed latest block number, skipping...`);
          continue;
        }

        this.logger.log(
          `refetch unstaking from ${Number(latestBlockNumber) + 1} to ${checkpoint.toBlockNumber}`,
        );

        failedRanges.push({
          from: Number(latestBlockNumber) + 1,
          to: Number(checkpoint.toBlockNumber),
          checkpointId: checkpoint.id,
        });
      }

      await this.queryRanges(failedRanges, QueryType.REFRESH_FAILED_UNSTAKING);
    } catch (error) {
      this.logger.error('Failed to process failed checkpoints', error);
      throw error;
    }
  }

  async fetchUnstakingEvents(
    fromBlock: number,
    toBlock: number,
  ): Promise<void> {
    try {
      this.validateBlockRange(fromBlock, toBlock);

      this.logger.log(
        `Fetching unstaking events from block ${fromBlock} to ${toBlock}`,
      );

      const splitRanges = this.splitIntoRanges(
        fromBlock,
        toBlock,
        ONE_WEEK_BLOCK_RANGE,
      );
      await this.queryRanges(splitRanges, QueryType.FETCH_UNSTAKING);
    } catch (error) {
      throw error;
    }
  }

  validateBlockRange(fromBlock: number, toBlock: number): void {
    if (fromBlock < 0 || toBlock < 0) {
      throw new Error('Block numbers must be non-negative');
    }
    if (fromBlock > toBlock) {
      throw new Error('From block must be less than or equal to to block');
    }
  }

  splitIntoRanges(
    fromBlock: number,
    toBlock: number,
    splitValue: number,
  ): BlockRange[] {
    const ranges: BlockRange[] = [];

    for (let current = fromBlock; current < toBlock; current += splitValue) {
      const rangeEnd = Math.min(current + splitValue - 1, toBlock);
      ranges.push({ from: current, to: rangeEnd });
    }

    return ranges;
  }

  async queryRanges(ranges: BlockRange[], type: string): Promise<void> {
    try {
      for (const range of ranges) {
        await this.queue.add(type, {
          type,
          fromBlock: range.from,
          toBlock: range.to,
          ...(range.checkpointId && {
            checkpointId: range.checkpointId,
          }),
        });

        // Prevent rate limit among requests
        await this.delay(MILLI_SECS_PER_SEC);
      }
    } catch (error) {
      this.logger.error('Failed to query ranges', error);
      throw error;
    }
  }

  async executeRangeQuery(range: BlockRange): Promise<void> {
    const allEvents: EventLog[] = [];
    try {
      const batches = this.createBatches(range.from, range.to);
      const promises = batches.map((batch) => {
        return this.web3Service.fetchUnstaking(batch.from, batch.to);
      });

      const batchResults = await Promise.all(promises);
      const events = batchResults.flat() as EventLog[];
      allEvents.push(...events);

      await this.logEvents(allEvents);
      await this.checkpointsService.saveLatestCheckpoint(
        range.to,
        range.from,
        QueryType.FETCH_UNSTAKING,
        false,
      );
    } catch (error) {
      await this.checkpointsService.saveLatestCheckpoint(
        range.to,
        range.from,
        QueryType.FETCH_UNSTAKING,
        true,
      );
      throw error;
    }
  }

  async executeFailedRangeQuery(
    range: BlockRange,
    checkpointId: string,
  ): Promise<void> {
    const allEvents: EventLog[] = [];
    try {
      const batches = this.createBatches(range.from, range.to);
      const promises = batches.map((batch) => {
        return this.web3Service.fetchUnstaking(batch.from, batch.to);
      });

      const batchResults = await Promise.all(promises);
      const events = batchResults.flat() as EventLog[];
      allEvents.push(...events);

      await this.logEvents(allEvents);
      await this.checkpointsService.update(checkpointId, {
        isFailed: false,
      });
    } catch (error) {
      throw error;
    }
  }

  createBatches(fromBlock: number, toBlock: number): IBatch[] {
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

  async logEvents(events: EventLog[]): Promise<void> {
    if (!Array.isArray(events) || events.length === 0) {
      this.logger.log('No unstaking events found');
      return;
    }

    this.logger.log(`Processing ${events.length} unstaking events`);

    const batches = this.splitEventProcess(events);

    for (const batch of batches) {
      const promises = batch.map((event) => {
        return this.processUnstakingEvent(event);
      });

      await Promise.all(promises);

      await this.delay(MILLI_SECS_PER_SEC);
    }

    this.logger.log('Finished processing unstaking events');
  }

  splitEventProcess(events: EventLog[]): EventLog[][] {
    const maxProcessNumber = 10;

    const batches: EventLog[][] = [];

    for (let i = 0; i < events.length; i += maxProcessNumber) {
      const maxItem = Math.min(i + maxProcessNumber, events.length);
      batches.push(events.slice(i, maxItem));
    }

    return batches;
  }

  async processUnstakingEvent(event: EventLog): Promise<void> {
    const [walletAddress, amount] = event.args;

    if (!walletAddress || !amount) {
      this.logger.warn(
        `Invalid event args for transaction ${event.transactionHash}`,
      );
      return;
    }

    if (!ethers.isAddress(walletAddress)) {
      this.logger.warn(
        `Invalid wallet address in transaction ${event.transactionHash}: ${walletAddress}`,
      );
      return;
    }

    const block = await this.provider.getBlock(event.blockNumber);
    const unstakeTime = block?.timestamp || 0;

    const unstakingEvent = {
      txHash: event.transactionHash,
      walletAddress: walletAddress,
      amount: String(formatEtherNumber(amount)),
      blockNumber: String(event.blockNumber),
      unstakeTime: formatTimestamp(BigInt(unstakeTime)),
    };

    await this.unstakingEventsService.create(unstakingEvent);
  }

  delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
