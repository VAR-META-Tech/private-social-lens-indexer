import { Injectable, Logger } from '@nestjs/common';
import { JobRepository } from './infrastructure/persistence/relational/repositories/job.repository';
import { Job, JobStatus } from './domain/job';

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(private readonly jobRepository: JobRepository) {}

  async createJob(job: Job): Promise<Job> {
    this.logger.log(
      `Creating job ${job.type} for blocks ${job.fromBlock}-${job.toBlock}`,
    );
    return this.jobRepository.create(job);
  }

  async getPendingJobs(limit: number = 100): Promise<Job[]> {
    return this.jobRepository.findPendingJobs(limit);
  }

  async getFailedJobs(limit: number = 100): Promise<Job[]> {
    return this.jobRepository.findFailedJobs(limit);
  }

  async getJobById(id: string): Promise<Job | null> {
    return this.jobRepository.findById(id);
  }

  async updateJob(job: Job): Promise<Job> {
    return this.jobRepository.update(job);
  }

  async deleteJob(id: string): Promise<void> {
    await this.jobRepository.delete(id);
  }

  async getStatistics(): Promise<{
    pending: number;
    queued: number;
    completed: number;
    failed: number;
  }> {
    const [pending, queued, completed, failed] = await Promise.all([
      this.jobRepository.countByStatus(JobStatus.PENDING),
      this.jobRepository.countByStatus(JobStatus.QUEUED),
      this.jobRepository.countByStatus(JobStatus.COMPLETED),
      this.jobRepository.countByStatus(JobStatus.FAILED),
    ]);

    return { pending, queued, completed, failed };
  }

  async retryFailedJobs(olderThanMinutes: number = 5): Promise<void> {
    const failedJobs =
      await this.jobRepository.findOldFailedJobs(olderThanMinutes);

    for (const job of failedJobs) {
      if (job.canRetry()) {
        job.resetForRetry();
        await this.jobRepository.update(job);
        this.logger.log(`Reset failed job ${job.id} for retry`);
      }
    }
  }
}
