import { Injectable, Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { StakingFetchService } from './staking/staking-fetch.service';
import { UnstakingFetchService } from './staking/unstaking-fetch.service';
import { ReqRewardFetchService } from './contributor/req-reward-fetch.service';
import { JobRepository } from '../jobs/infrastructure/persistence/relational/repositories/job.repository';
import { JobEventType, JobStatus } from '../jobs/domain/job';

export interface EventJob {
  taskId: string;
  eventType: JobEventType;
  fromBlock: number;
  toBlock: number;
  contractAddress?: string;
  eventNames?: string[];
}

@Processor('blockchain-index-event', {
  concurrency: 10,
  lockDuration: 180000,
  lockRenewTime: 120000,
  stalledInterval: 180000,
  maxStalledCount: 3,
})
@Injectable()
export class WorkerService extends WorkerHost {
  private readonly logger = new Logger(WorkerService.name);

  constructor(
    private readonly stakingFetchService: StakingFetchService,
    private readonly unstakingFetchService: UnstakingFetchService,
    private readonly reqRewardFetchService: ReqRewardFetchService,
    private readonly jobRepository: JobRepository,
  ) {
    super();
  }

  /**
   * Main job processing method - processes all jobs based on event type
   */
  async process(job: Job<EventJob>): Promise<void> {
    const startTime = Date.now();
    this.logger.log(
      `🚀 Starting job ${job.id} (${job.name}) - Attempt ${job.attemptsMade + 1}/${job.opts.attempts || 3}`,
    );

    try {
      // Validate job data
      if (!job.data) {
        throw new Error('Job data is missing');
      }

      // Validate event type
      if (!Object.values(JobEventType).includes(job.data.eventType)) {
        throw new Error(`Invalid event type: ${job.data.eventType}`);
      }

      // Process job based on event type
      await this.processEventJobByEventType(job.data);
      // throw new Error('failed');
      // update job to be completed
      await this.markJobAsCompleted(job.data.taskId);

      const duration = Date.now() - startTime;
      this.logger.log(
        `✅ Job ${job.id} (${job.name}) completed successfully in ${duration}ms`,
      );
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `❌ Job ${job.id} (${job.name}) failed after ${duration}ms:`,
        error,
      );

      // Update job status in database if taskId exists
      if (job.data.taskId) {
        await this.handleJobFailure(job.data, error);
      }
    }
  }

  /**
   * Process job based on event type
   */
  private async processEventJobByEventType(jobData: EventJob): Promise<void> {
    try {
      switch (jobData.eventType) {
        case JobEventType.REQUEST_REWARD:
          //  throw new Error('REQUEST_REWARD failed');
          await this.reqRewardFetchService.executeRangeQuery({
            from: jobData.fromBlock,
            to: jobData.toBlock,
          });
          this.logger.log(
            `✅ Successfully processed REQUEST_REWARD business logic for blocks ${jobData.fromBlock}-${jobData.toBlock}`,
          );
          break;

        case JobEventType.STAKING:
          await this.stakingFetchService.executeRangeQuery({
            from: jobData.fromBlock,
            to: jobData.toBlock,
          });
          this.logger.log(
            `✅ Successfully processed STAKING business logic for blocks ${jobData.fromBlock}-${jobData.toBlock}`,
          );
          break;

        case JobEventType.UNSTAKING:
          await this.unstakingFetchService.executeRangeQuery({
            from: jobData.fromBlock,
            to: jobData.toBlock,
          });
          this.logger.log(
            `✅ Successfully processed UNSTAKING business logic for blocks ${jobData.fromBlock}-${jobData.toBlock}`,
          );
          break;
        default:
          this.logger.warn(`⚠️ Unknown event type: ${jobData.eventType}`);
      }
    } catch (error) {
      this.logger.error(
        `❌ Error processing ${jobData.eventType} business logic:`,
        error,
      );
      throw error;
    }
  }
  /**
   * Mark job as completed in database
   */
  private async markJobAsCompleted(taskId: string): Promise<void> {
    try {
      const job = await this.jobRepository.findById(taskId);
      if (job) {
        job.markAsCompleted();
        await this.jobRepository.update(job);
        this.logger.log(`✅ Marked job ${taskId} as completed`);
      } else {
        this.logger.warn(`⚠️ Job ${taskId} not found in database`);
      }
    } catch (error) {
      this.logger.error(`❌ Error marking job ${taskId} as completed:`, error);
    }
  }

  /**
   * Handle job failure and update status
   */
  private async handleJobFailure(
    jobData: EventJob,
    error: Error,
  ): Promise<void> {
    if (!jobData.taskId) return;

    try {
      const job = await this.jobRepository.findById(jobData.taskId);
      if (job) {
        job.markAsFailed(error.message);
        await this.jobRepository.update(job);
        this.logger.log(
          `❌ Marked job ${jobData.taskId} as failed: ${error.message}`,
        );
      }
    } catch (dbError) {
      this.logger.error(
        `❌ Error updating job ${jobData.taskId} failure status:`,
        dbError,
      );
    }
  }

  /**
   * Get worker statistics
   */
  async getWorkerStats(): Promise<{
    totalJobs: number;
    completedJobs: number;
    failedJobs: number;
    pendingJobs: number;
  }> {
    try {
      const [completedJobs, failedJobs, pendingJobs] = await Promise.all([
        this.jobRepository.countByStatus(JobStatus.COMPLETED),
        this.jobRepository.countByStatus(JobStatus.FAILED),
        this.jobRepository.countByStatus(JobStatus.PENDING),
      ]);

      const totalJobs = completedJobs + failedJobs + pendingJobs;

      return {
        totalJobs,
        completedJobs,
        failedJobs,
        pendingJobs,
      };
    } catch (error) {
      this.logger.error('Error getting worker stats:', error);
      throw error;
    }
  }
}
