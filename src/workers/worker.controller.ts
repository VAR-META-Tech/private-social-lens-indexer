import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { WorkerService } from './worker.service';

@ApiTags('Worker')
@Controller({
  path: 'worker',
  version: '1',
})
export class WorkerController {
  constructor(private readonly workerService: WorkerService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get worker statistics' })
  @ApiResponse({
    status: 200,
    description: 'Worker statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalJobs: { type: 'number' },
        completedJobs: { type: 'number' },
        failedJobs: { type: 'number' },
        pendingJobs: { type: 'number' },
      },
    },
  })
  async getWorkerStats() {
    return this.workerService.getWorkerStats();
  }
}
