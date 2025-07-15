import { Injectable } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { StakingFetchService } from './staking/staking-fetch.service';
import { UnstakingFetchService } from './staking/unstaking-fetch.service';

export interface FetchStakingJob {
  type: 'fetch-staking';
  fromBlock: number;
  toBlock: number;
}

export interface FetchUnstakingJob {
  type: 'fetch-unstaking';
  fromBlock: number;
  toBlock: number;
}

export type BlockchainFetchJob = FetchStakingJob | FetchUnstakingJob;

@Processor('blockchain-events', {
  concurrency: 1, // Process one job at a time toi prevent rate limit
})
@Injectable()
export class WorkerService extends WorkerHost {
  constructor(
    private readonly stakingFetchService: StakingFetchService,
    private readonly unstakingFetchService: UnstakingFetchService,
  ) {
    super();
  }

  async process(job: Job<BlockchainFetchJob>): Promise<void> {
    await this.processFetchJob(job.data);
  }

  async processFetchJob(job: BlockchainFetchJob): Promise<void> {
    console.log('Processing blockchain fetch job:', job.type);

    try {
      if (job.type === 'fetch-staking') {
        await this.stakingFetchService.fetchStakingEvents(
          job.fromBlock,
          job.toBlock,
        );
        console.log('Successfully processed fetch staking job');
      } else if (job.type === 'fetch-unstaking') {
        await this.unstakingFetchService.fetchUnstakingEvents(
          job.fromBlock,
          job.toBlock,
        );
        console.log('Successfully processed fetch unstaking job');
      }
    } catch (error) {
      throw error;
    }
  }

  async processJobsSequentially(jobs: BlockchainFetchJob[]): Promise<void> {
    console.log(`Processing ${jobs.length} jobs sequentially`);

    for (const job of jobs) {
      console.log(`Processing job: ${job.type}`);
      await this.processFetchJob(job);
      console.log(`Completed job: ${job.type}`);
    }
  }
}
