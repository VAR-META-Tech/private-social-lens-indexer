import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { IndexingOrchestratorService } from './indexing-orchestrator.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { Job } from '../jobs/domain/job';
import { CrawlBlockRangeDto, RetryFailedJobsDto } from './dto';

@ApiTags('Orchestrator Indexing')
@Controller({
  path: 'indexing',
  version: '1',
})
export class IndexingOrchestratorController {
  constructor(
    private readonly indexingOrchestratorService: IndexingOrchestratorService,
  ) {}

  @Post('crawl')
  @ApiBody({
    type: CrawlBlockRangeDto,
    description: 'Block range to crawl',
    examples: {
      example: {
        summary: 'Crawl blocks 1000000 to 1010000',
        description: 'Crawl a range of 10,000 blocks',
        value: {
          fromBlock: 1000000,
          toBlock: 1010000,
        },
      },
    },
  })
  async crawlBlockRange(@Body() dto: CrawlBlockRangeDto): Promise<{
    message: string;
    fromBlock: number;
    toBlock: number;
  }> {
    console.log(
      '🚀 ~ IndexingOrchestratorController ~ crawlBlockRange ~ dto:',
      dto,
    );
    await this.indexingOrchestratorService.crawlBlockRange(
      dto.fromBlock,
      dto.toBlock,
    );

    return {
      message: 'CRAWL initiated successfully',
      fromBlock: dto.fromBlock,
      toBlock: dto.toBlock,
    };
  }

  @Get('statistics')
  @ApiOperation({
    summary: 'Get indexing statistics',
    description:
      'Retrieves current statistics about the indexing process including job counts and block ranges',
  })
  @ApiResponse({
    status: 200,
    description: 'Indexing statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        pending: {
          type: 'number',
          example: 5,
          description: 'Number of pending jobs',
        },
        queued: {
          type: 'number',
          example: 10,
          description: 'Number of queued jobs',
        },
        completed: {
          type: 'number',
          example: 100,
          description: 'Number of completed jobs',
        },
        failed: {
          type: 'number',
          example: 2,
          description: 'Number of failed jobs',
        },
        totalEvents: {
          type: 'number',
          example: 1500,
          description: 'Total number of indexed events',
        },
        lastIndexedBlock: {
          type: 'number',
          example: 1500000,
          description: 'Latest block that has been indexed',
        },
        oldestIndexBlock: {
          type: 'number',
          example: 1000000,
          description: 'Oldest block that has been indexed',
        },
      },
    },
  })
  async getStatistics(): Promise<{
    pending: number;
    queued: number;
    completed: number;
    failed: number;
    totalEvents: number;
    lastIndexedBlock: number;
    oldestIndexBlock: number;
  }> {
    return await this.indexingOrchestratorService.getStatistics();
  }

  @Get('failed-jobs')
  @ApiOperation({
    summary: 'Get all failed jobs',
    description:
      'Retrieves a list of all failed jobs with optional limit parameter',
  })
  @ApiResponse({
    status: 200,
    description: 'Failed jobs retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: 'job-123',
            description: 'Unique job identifier',
          },
          type: {
            type: 'string',
            example: 'REQUEST_REWARD',
            description: 'Type of job',
          },
          eventType: {
            type: 'string',
            example: 'REQUEST_REWARD',
            description: 'Type of event being processed',
          },
          status: {
            type: 'string',
            example: 'FAILED',
            description: 'Current status of the job',
          },
          fromBlock: {
            type: 'number',
            example: 1000000,
            description: 'Starting block number',
          },
          toBlock: {
            type: 'number',
            example: 1010000,
            description: 'Ending block number',
          },
          attempts: {
            type: 'number',
            example: 3,
            description: 'Number of attempts made',
          },
          maxAttempts: {
            type: 'number',
            example: 5,
            description: 'Maximum number of attempts allowed',
          },
          lastAttemptAt: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-15T10:30:00Z',
            description: 'Timestamp of last attempt',
          },
          error: {
            type: 'string',
            example: 'Network timeout',
            description: 'Error message from last failure',
          },
        },
      },
    },
  })
  async getFailedJobs(@Query('limit') limit?: number): Promise<Job[]> {
    return await this.indexingOrchestratorService.getFailedJobs(limit);
  }

  @Post('retry-failed-jobs')
  @ApiOperation({
    summary: 'Retry specific failed jobs',
    description:
      'Manually retries a list of failed jobs by their IDs. Manual retries bypass the automatic attempt limit and can retry any failed job regardless of previous attempt count.',
  })
  @ApiBody({
    type: RetryFailedJobsDto,
    description: 'Job IDs to retry',
    examples: {
      example: {
        summary: 'Retry specific failed jobs',
        description: 'Retry jobs with IDs job-123 and job-456',
        value: {
          jobIds: ['job-123', 'job-456'],
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Failed jobs retry operation completed',
    schema: {
      type: 'object',
      properties: {
        retried: {
          type: 'array',
          items: { type: 'string' },
          example: ['job-123', 'job-456'],
          description: 'Job IDs that were successfully reset for retry',
        },
        skipped: {
          type: 'array',
          items: { type: 'string' },
          example: ['job-789'],
          description: 'Job IDs that were skipped (not in FAILED status)',
        },
        notFound: {
          type: 'array',
          items: { type: 'string' },
          example: ['job-999'],
          description: 'Job IDs that were not found in the database',
        },
        message: {
          type: 'string',
          example: 'Retry operation completed',
          description: 'Summary message of the operation',
        },
      },
    },
  })
  async retryFailedJobs(@Body() dto: RetryFailedJobsDto): Promise<{
    retried: string[];
    skipped: string[];
    notFound: string[];
    message: string;
  }> {
    const result = await this.indexingOrchestratorService.retryFailedJobsByIds(
      dto.jobIds,
    );

    return {
      ...result,
      message: 'Retry operation completed',
    };
  }
}
