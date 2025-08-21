import { Controller, Get, Post, Delete, Param, Query } from '@nestjs/common';
import { JobsService } from './jobs.service';

@Controller('api/jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get('statistics')
  async getStatistics() {
    return this.jobsService.getStatistics();
  }

  @Get('pending')
  async getPendingJobs(@Query('limit') limit?: number) {
    return this.jobsService.getPendingJobs(limit);
  }

  @Get('failed')
  async getFailedJobs(@Query('limit') limit?: number) {
    return this.jobsService.getFailedJobs(limit);
  }

  @Get(':id')
  async getJobById(@Param('id') id: string) {
    return this.jobsService.getJobById(id);
  }

  @Delete(':id')
  async deleteJob(@Param('id') id: string) {
    await this.jobsService.deleteJob(id);
    return { message: 'Job deleted successfully' };
  }

  @Post('retry-failed')
  async retryFailedJobs(@Query('olderThanMinutes') olderThanMinutes?: number) {
    await this.jobsService.retryFailedJobs(olderThanMinutes);
    return { message: 'Failed jobs retry initiated' };
  }
}
