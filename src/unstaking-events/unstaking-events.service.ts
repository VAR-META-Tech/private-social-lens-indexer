import {
  // common
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CreateUnstakingEventDto } from './dto/create-unstaking-event.dto';
import { UpdateUnstakingEventDto } from './dto/update-unstaking-event.dto';
import { UnstakingEventRepository } from './infrastructure/persistence/unstaking-events.repository';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { UnstakingEvent } from './domain/unstaking-event';
import { UnstakingEventEntity } from './infrastructure/persistence/relational/entities/unstaking-event.entity';
import { GetUnstakeInfoDto } from './dto/get-unstake-info.dto';

@Injectable()
export class UnstakingEventsService {
  private readonly logger = new Logger(UnstakingEventsService.name);

  constructor(
    // Dependencies here
    private readonly unstakingEventRepository: UnstakingEventRepository,
    private readonly dataSource: DataSource,
  ) {}

  async getTotalUnstakeAmount(query: GetUnstakeInfoDto): Promise<number> {
    try {
      this.validateDateRange(query);

      const result = await this.dataSource
        .createQueryBuilder(UnstakingEventEntity, 'unstakingEvents')
        .where(
          'unstakingEvents.unstake_time >= :startDate AND unstakingEvents.unstake_time <= :endDate',
          {
            startDate: query.startDate,
            endDate: query.endDate,
          },
        )
        .select(
          'COALESCE(SUM(CAST(unstakingEvents.amount AS DECIMAL)), 0) as total_unstake_amount',
        )
        .getRawOne();

      const totalAmount = Number(result?.total_unstake_amount || 0);

      this.logger.log(
        `Total unstake amount for period ${query.startDate}-${query.endDate}: ${totalAmount}`,
      );

      return totalAmount;
    } catch (error) {
      this.logger.error('Failed to get total unstake amount', error);
      throw new InternalServerErrorException(
        'Failed to retrieve total unstake amount',
      );
    }
  }

  async getTop5Unstakers(
    query: GetUnstakeInfoDto,
  ): Promise<Array<{ wallet_address: string; unstake_amount: string }>> {
    try {
      this.validateDateRange(query);

      const result = await this.dataSource
        .createQueryBuilder(UnstakingEventEntity, 'unstakingEvents')
        .where(
          'unstakingEvents.unstake_time >= :startDate AND unstakingEvents.unstake_time <= :endDate',
          {
            startDate: query.startDate,
            endDate: query.endDate,
          },
        )
        .select([
          'unstakingEvents.wallet_address as wallet_address',
          'SUM(CAST(unstakingEvents.amount AS DECIMAL)) as unstake_amount',
        ])
        .groupBy('unstakingEvents.wallet_address')
        .orderBy('unstake_amount', 'DESC')
        .limit(5)
        .getRawMany();

      this.logger.log(
        `Retrieved top 5 unstakers for period ${query.startDate}-${query.endDate}: ${result.length} records`,
      );

      return result;
    } catch (error) {
      this.logger.error('Failed to get top 5 unstakers', error);
      throw new InternalServerErrorException(
        'Failed to retrieve top unstakers',
      );
    }
  }

  async getUnstakingMovement(
    query: GetUnstakeInfoDto,
  ): Promise<Array<{ unstakeamount: string; date: string }>> {
    try {
      this.validateDateRange(query);

      const result = await this.dataSource
        .createQueryBuilder(UnstakingEventEntity, 'unstakingEvents')
        .where(
          'unstakingEvents.unstake_time >= :startDate AND unstakingEvents.unstake_time <= :endDate',
          {
            startDate: query.startDate,
            endDate: query.endDate,
          },
        )
        .select([
          'SUM(CAST(unstakingEvents.amount AS DECIMAL)) as unstakeamount',
          "DATE(to_timestamp(unstakingEvents.unstake_time / 1000) AT TIME ZONE 'UTC') as date",
        ])
        .groupBy(
          "DATE(to_timestamp(unstakingEvents.unstake_time / 1000) AT TIME ZONE 'UTC')",
        )
        .orderBy('date', 'ASC')
        .getRawMany();

      const movementData = this.generateCompleteDateRange(query, result);

      this.logger.log(
        `Generated unstaking movement data for period ${query.startDate}-${query.endDate}: ${movementData.length} days`,
      );

      return movementData;
    } catch (error) {
      this.logger.error('Failed to get unstaking movement', error);
      throw new InternalServerErrorException(
        'Failed to retrieve unstaking movement data',
      );
    }
  }

  async create(
    createUnstakingEventDto: CreateUnstakingEventDto,
  ): Promise<UnstakingEvent> {
    try {
      const result = await this.unstakingEventRepository.create(
        createUnstakingEventDto,
      );

      this.logger.log(`Created unstaking event: ${result.id}`);

      return result;
    } catch (error) {
      this.logger.error('Failed to create unstaking event', error);
      throw new InternalServerErrorException(
        'Failed to create unstaking event',
      );
    }
  }

  async findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }): Promise<UnstakingEvent[]> {
    try {
      const result = await this.unstakingEventRepository.findAllWithPagination({
        paginationOptions: {
          page: paginationOptions.page,
          limit: paginationOptions.limit,
        },
      });

      this.logger.log(
        `Retrieved unstaking events: page ${paginationOptions.page}, limit ${paginationOptions.limit}`,
      );

      return result;
    } catch (error) {
      this.logger.error(
        'Failed to retrieve unstaking events with pagination',
        error,
      );
      throw new InternalServerErrorException(
        'Failed to retrieve unstaking events',
      );
    }
  }

  async findById(id: UnstakingEvent['id']): Promise<UnstakingEvent | null> {
    try {
      if (!id) {
        throw new BadRequestException('Invalid unstaking event ID');
      }

      const result = await this.unstakingEventRepository.findById(id);

      if (!result) {
        this.logger.warn(`Unstaking event not found: ${id}`);
      }

      return result;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to find unstaking event by ID: ${id}`, error);
      throw new InternalServerErrorException(
        'Failed to retrieve unstaking event',
      );
    }
  }

  async findByIds(ids: UnstakingEvent['id'][]): Promise<UnstakingEvent[]> {
    try {
      if (!Array.isArray(ids) || ids.length === 0) {
        return [];
      }

      const validIds = ids.filter((id) => id != null);

      if (validIds.length === 0) {
        return [];
      }

      const result = await this.unstakingEventRepository.findByIds(validIds);

      this.logger.log(
        `Retrieved ${result.length} unstaking events from ${validIds.length} requested IDs`,
      );

      return result;
    } catch (error) {
      this.logger.error('Failed to find unstaking events by IDs', error);
      throw new InternalServerErrorException(
        'Failed to retrieve unstaking events',
      );
    }
  }

  async update(
    id: UnstakingEvent['id'],
    updateUnstakingEventDto: UpdateUnstakingEventDto,
  ): Promise<UnstakingEvent | null> {
    try {
      if (!id) {
        throw new BadRequestException('Invalid unstaking event ID');
      }

      const result = await this.unstakingEventRepository.update(
        id,
        updateUnstakingEventDto,
      );

      this.logger.log(`Updated unstaking event: ${id}`);

      return result;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to update unstaking event: ${id}`, error);
      throw new InternalServerErrorException(
        'Failed to update unstaking event',
      );
    }
  }

  async remove(id: UnstakingEvent['id']): Promise<void> {
    try {
      if (!id) {
        throw new BadRequestException('Invalid unstaking event ID');
      }

      await this.unstakingEventRepository.remove(id);

      this.logger.log(`Removed unstaking event: ${id}`);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to remove unstaking event: ${id}`, error);
      throw new InternalServerErrorException(
        'Failed to remove unstaking event',
      );
    }
  }

  async findLatestUnstake(): Promise<UnstakingEvent | null> {
    try {
      const result = await this.unstakingEventRepository.findLatestUnstake();

      if (result) {
        this.logger.log(
          `Found latest unstake: ${result.id} at block ${result.block_number}`,
        );
      } else {
        this.logger.log('No unstaking events found');
      }

      return result;
    } catch (error) {
      this.logger.error('Failed to find latest unstake', error);
      throw new InternalServerErrorException(
        'Failed to retrieve latest unstake',
      );
    }
  }

  private validateDateRange(query: GetUnstakeInfoDto): void {
    if (!query.startDate || !query.endDate) {
      throw new BadRequestException('Start date and end date are required');
    }

    const startDate = Number(query.startDate);
    const endDate = Number(query.endDate);

    if (isNaN(startDate) || isNaN(endDate)) {
      throw new BadRequestException('Invalid date format');
    }

    if (startDate > endDate) {
      throw new BadRequestException(
        'Start date must be before or equal to end date',
      );
    }

    if (startDate < 0 || endDate < 0) {
      throw new BadRequestException('Dates must be non-negative');
    }
  }

  private generateCompleteDateRange(
    query: GetUnstakeInfoDto,
    result: Array<{ unstakeamount: string; date: string }>,
  ): Array<{ unstakeamount: string; date: string }> {
    // Create a map of existing unstakes by date
    const unstakesByDate: { [key: string]: string } = {};
    result.forEach((row) => {
      const dateKey = new Date(row.date).toISOString().split('T')[0];
      unstakesByDate[dateKey] = row.unstakeamount;
    });

    // Generate all days in the range with mock data for missing days
    const finalResult: Array<{ unstakeamount: string; date: string }> = [];
    const start = new Date(Number(query.startDate));
    const end = new Date(Number(query.endDate));

    const daysDiff = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
    );

    for (let i = 0; i <= daysDiff; i++) {
      const currentDate = new Date(start);
      currentDate.setDate(start.getDate() + i);

      const dateKey = currentDate.toISOString().split('T')[0];
      const unstakeAmount = unstakesByDate[dateKey] || '0';

      finalResult.push({
        unstakeamount: unstakeAmount,
        date: currentDate.toISOString(),
      });
    }

    return finalResult;
  }
}
