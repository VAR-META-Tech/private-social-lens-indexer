import { Injectable } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { StakingFetchService } from './staking/staking-fetch.service';
import { UnstakingFetchService } from './staking/unstaking-fetch.service';
import { ReqRewardFetchService } from './contributor/req-reward-fetch.service';
import { QueryType } from 'src/utils/common.type';

export interface FetchStakingJob {
  type: QueryType.FETCH_STAKING;
  fromBlock: number;
  toBlock: number;
}

export interface FetchUnstakingJob extends Omit<FetchStakingJob, 'type'> {
  type: QueryType.FETCH_UNSTAKING;
}

export interface FetchReqRewardJob extends Omit<FetchStakingJob, 'type'> {
  type: QueryType.FETCH_REQUEST_REWARD;
}

export interface RefetchFailedReqRewardJob
  extends Omit<FetchStakingJob, 'type'> {
  type: QueryType.REFRESH_FAILED_REQUEST_REWARD;
  checkpointId: string;
}

export interface RefetchFailedUnstakingJob
  extends Omit<FetchStakingJob, 'type'> {
  type: QueryType.REFRESH_FAILED_UNSTAKING;
  checkpointId: string;
}

export interface RefetchFailedStakingJob extends Omit<FetchStakingJob, 'type'> {
  type: QueryType.REFRESH_FAILED_STAKING;
  checkpointId: string;
}

export type BlockchainFetchJob =
  | FetchStakingJob
  | FetchUnstakingJob
  | FetchReqRewardJob
  | RefetchFailedReqRewardJob
  | RefetchFailedUnstakingJob
  | RefetchFailedStakingJob;

@Processor('blockchain-index-event', {
  concurrency: 10,
  lockDuration: 180000,
  lockRenewTime: 120000,
  stalledInterval: 180000,
})
@Injectable()
export class WorkerService extends WorkerHost {
  constructor(
    private readonly stakingFetchService: StakingFetchService,
    private readonly unstakingFetchService: UnstakingFetchService,
    private readonly reqRewardFetchService: ReqRewardFetchService,
  ) {
    super();
  }

  async process(job: Job<BlockchainFetchJob>): Promise<void> {
    await this.processFetchJob(job.data);
  }

  async processFetchJob(job: BlockchainFetchJob): Promise<void> {
    console.log('Processing blockchain fetch job:', job.type);

    try {
      if (job.type === QueryType.FETCH_STAKING) {
        await this.stakingFetchService.executeRangeQuery({
          from: job.fromBlock,
          to: job.toBlock,
        });
        console.log('Successfully processed fetch staking job');
      } else if (job.type === QueryType.FETCH_UNSTAKING) {
        await this.unstakingFetchService.executeRangeQuery({
          from: job.fromBlock,
          to: job.toBlock,
        });
        console.log('Successfully processed fetch unstaking job');
      } else if (job.type === QueryType.FETCH_REQUEST_REWARD) {
        await this.reqRewardFetchService.executeRangeQuery({
          from: job.fromBlock,
          to: job.toBlock,
        });
        console.log('Successfully processed fetch req reward job');
      } else if (job.type === QueryType.REFRESH_FAILED_REQUEST_REWARD) {
        await this.reqRewardFetchService.executeFailedRangeQuery(
          {
            from: job.fromBlock,
            to: job.toBlock,
          },
          job.checkpointId,
        );
        console.log('Successfully processed refetch failed req reward job');
      } else if (job.type === QueryType.REFRESH_FAILED_UNSTAKING) {
        await this.unstakingFetchService.executeFailedRangeQuery(
          {
            from: job.fromBlock,
            to: job.toBlock,
          },
          job.checkpointId,
        );
        console.log('Successfully processed refetch failed unstaking job');
      } else if (job.type === QueryType.REFRESH_FAILED_STAKING) {
        console.log('🚀 ~ WorkerService ~ processFetchJob ~ job:', job);
        await this.stakingFetchService.executeFailedRangeQuery(
          {
            from: job.fromBlock,
            to: job.toBlock,
          },
          job.checkpointId,
        );
        console.log('Successfully processed refetch failed staking job');
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
