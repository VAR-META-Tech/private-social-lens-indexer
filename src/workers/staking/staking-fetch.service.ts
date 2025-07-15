import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventLog, ethers } from 'ethers';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  formatEtherNumber,
  formatTimestamp,
  convertToDays,
} from '../../utils/helper';
import { Web3Service } from '../../web3/web3.service';
import { AllConfigType } from '../../config/config.type';
import { IWeb3Config } from '../../config/app-config.type';
import { StakingEventsService } from '../../staking-events/staking-events.service';
import { MILLI_SECS_PER_SEC, ONE_MONTH_BLOCK_RANGE } from '../../utils/const';
import { BlockRange, IBatch } from '../../utils/types/common.type';

@Injectable()
export class StakingFetchService implements OnModuleInit {
  private readonly logger = new Logger(StakingFetchService.name);
  private newestBlock: number = 0;
  private web3Config: IWeb3Config | undefined;
  private stakingContract: ethers.Contract;

  constructor(
    private readonly web3Service: Web3Service,
    private readonly configService: ConfigService<AllConfigType>,
    private readonly stakingEventsService: StakingEventsService,
    @InjectQueue('blockchain-events') private readonly queue: Queue,
  ) {
    this.web3Config = this.configService.get('app.web3Config', {
      infer: true,
    });
    this.stakingContract = this.web3Service.getStakingContract();
  }

  async onModuleInit(): Promise<void> {
    try {
      this.logger.log('Initializing StakingFetchService...');

      this.newestBlock = await this.web3Service.getCurrentBlock();
      this.logger.log(`Current block: ${this.newestBlock}`);

      const initDataDuration = this.web3Config?.initDataDuration || 3;
      let fromBlock =
        this.newestBlock - initDataDuration * ONE_MONTH_BLOCK_RANGE;

      // Ensure fromBlock is not negative
      fromBlock = Math.max(fromBlock, 0);

      const latestStake = await this.stakingEventsService.findLatestStake();

      if (latestStake) {
        const latestBlockNumber = Number(latestStake.block_number);
        if (!isNaN(latestBlockNumber) && latestBlockNumber >= 0) {
          fromBlock = latestBlockNumber + 1;
        }
      }

      this.logger.log(
        `Fetching from block ${fromBlock} to ${this.newestBlock}`,
      );

      await this.queue.add('fetch-staking', {
        type: 'fetch-staking',
        fromBlock,
        toBlock: this.newestBlock,
      });

      this.logger.log('Staking fetch job queued successfully');
    } catch (error) {
      throw error;
    }
  }

  async fetchStakingEvents(fromBlock: number, toBlock: number): Promise<void> {
    try {
      this.validateBlockRange(fromBlock, toBlock);

      this.logger.log(
        `Fetching staking events from block ${fromBlock} to ${toBlock}`,
      );

      const monthlyRanges = this.splitIntoMonthlyRanges(fromBlock, toBlock);
      const allEvents = await this.queryMonthlyRanges(monthlyRanges);

      this.logger.log(`Successfully fetched ${allEvents.length} events`);
      await this.logEvents(allEvents);
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
      return this.web3Service.fetchStaking(batch.from, batch.to);
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

  async findStake(
    user: string,
    amount: bigint,
    startTime: bigint,
    duration: bigint,
  ): Promise<any> {
    try {
      if (!user || !ethers.isAddress(user)) {
        throw new Error('Invalid user address');
      }

      const totalStakes = await this.stakingContract.getActiveStakes(user);

      if (!Array.isArray(totalStakes)) {
        this.logger.warn(
          `Invalid response from getActiveStakes for user ${user}`,
        );
        return null;
      }

      const stake = totalStakes.find(
        (stake) =>
          formatEtherNumber(stake.amount) === formatEtherNumber(amount) &&
          formatTimestamp(stake.startTime) === formatTimestamp(startTime) &&
          convertToDays(Number(stake.duration)) ===
            convertToDays(Number(duration)),
      );

      return stake || null;
    } catch (error) {
      this.logger.error(`Failed to find stake for user ${user}`, error);
      return null;
    }
  }

  async logEvents(events: EventLog[]): Promise<void> {
    if (!Array.isArray(events) || events.length === 0) {
      this.logger.log('No staking events found');
      return;
    }

    this.logger.log(`Processing ${events.length} staking events`);

    for (const event of events) {
      try {
        await this.processStakingEvent(event);
      } catch (error) {
        throw error;
      }
    }

    this.logger.log('Finished processing staking events');
  }

  private async processStakingEvent(event: EventLog): Promise<void> {
    const [user, amount, startTime, duration] = event.args;

    if (!user || !amount || !startTime || !duration) {
      this.logger.warn(
        `Invalid event args for transaction ${event.transactionHash}`,
      );
      return;
    }

    const stake = await this.findStake(user, amount, startTime, duration);

    const stakingEvent = {
      tx_hash: event.transactionHash,
      wallet_address: user,
      amount: String(formatEtherNumber(amount)),
      start_time: String(formatTimestamp(startTime)),
      duration: String(convertToDays(Number(duration))),
      block_number: String(event.blockNumber),
      has_withdrawal: stake?.hasWithdrawn || false,
      withdrawal_time: stake?.withdrawalTime
        ? formatTimestamp(stake.withdrawalTime)
        : null,
    };

    await this.stakingEventsService.create(stakingEvent);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
