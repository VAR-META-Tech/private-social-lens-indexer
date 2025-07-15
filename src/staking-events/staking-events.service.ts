import {
  // common
  Injectable,
  Logger,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Big } from 'big.js';
import { DataSource } from 'typeorm';
import { CreatestakingEventDto } from './dto/create-staking-event.dto';
import { UpdateStakingEventDto } from './dto/update-staking-event.dto';
import { StakingEventsRepository } from './infrastructure/persistence/staking-events.repository';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { GetStakeInfoDto } from './dto/get-stake-info.dto';
import { StakingEventEntity } from './infrastructure/persistence/relational/entities/staking-event.entity';
import { StakingEvent } from './domain/staking-event';
import { UnstakingEventsService } from '../unstaking-events/unstaking-events.service';
import {
  DAYS_PER_WEEK,
  MILLI_SECS_PER_SEC,
  SECS_PER_DAY,
} from '../utils/const';

@Injectable()
export class StakingEventsService {
  private readonly logger = new Logger(StakingEventsService.name);

  constructor(
    // Dependencies here
    private readonly dataSource: DataSource,
    private readonly stakingEventsRepository: StakingEventsRepository,
    private readonly unstakingEventsService: UnstakingEventsService,
  ) {}

  async getTotalStakeAmount(query: GetStakeInfoDto): Promise<number> {
    try {
      this.validateDateRange(query);
      const result = await this.dataSource
        .createQueryBuilder(StakingEventEntity, 'stakingEvents')
        .where(
          'stakingEvents.start_time >= :startDate AND stakingEvents.start_time <= :endDate',
          {
            startDate: query.startDate,
            endDate: query.endDate,
          },
        )
        .select(
          'COALESCE(SUM(CAST(stakingEvents.amount AS DECIMAL)), 0) as total_stake_amount',
        )
        .getRawOne();
      const totalAmount = Number(result?.total_stake_amount || 0);
      this.logger.log(
        `Total stake amount for period ${query.startDate}-${query.endDate}: ${totalAmount}`,
      );
      return totalAmount;
    } catch (error) {
      this.logger.error('Failed to get total stake amount', error);
      throw new InternalServerErrorException(
        'Failed to retrieve total stake amount',
      );
    }
  }

  async getTokenFlowInfo(query: GetStakeInfoDto) {
    try {
      this.validateDateRange(query);
      const { startDate, endDate } = query;
      const totalDayCount = Math.ceil(
        (Number(endDate) - Number(startDate)) /
          (MILLI_SECS_PER_SEC * SECS_PER_DAY),
      );
      const totalWeekCount = Math.ceil(totalDayCount / DAYS_PER_WEEK);
      const totalStakeAmount = await this.getTotalStakeAmount({
        startDate,
        endDate,
      });
      const totalUnstakeAmount =
        await this.unstakingEventsService.getTotalUnstakeAmount({
          startDate,
          endDate,
        });
      const netFlow = new Big(totalStakeAmount).minus(totalUnstakeAmount);
      const dailyNetFlow =
        totalDayCount > 0 ? netFlow.div(totalDayCount) : new Big(0);
      const weeklyNetFlow =
        totalWeekCount > 0 ? netFlow.div(totalWeekCount) : new Big(0);
      this.logger.log(
        `Token flow info for period ${startDate}-${endDate}: netFlow=${netFlow.toString()}, dailyNetFlow=${dailyNetFlow.toString()}, weeklyNetFlow=${weeklyNetFlow.toString()}`,
      );
      return {
        totalStakeAmount,
        totalUnstakeAmount,
        netFlow: netFlow.toString(),
        dailyNetFlow: dailyNetFlow.toString(),
        weeklyNetFlow: weeklyNetFlow.toString(),
      };
    } catch (error) {
      this.logger.error('Failed to get token flow info', error);
      throw new InternalServerErrorException(
        'Failed to retrieve token flow info',
      );
    }
  }

  async getTop5Stakers(
    query: GetStakeInfoDto,
  ): Promise<Array<{ wallet_address: string; stake_amount: string }>> {
    try {
      this.validateDateRange(query);
      const { startDate, endDate } = query;
      const result = await this.dataSource
        .createQueryBuilder(StakingEventEntity, 'stakingEvents')
        .where(
          'stakingEvents.start_time >= :startDate AND stakingEvents.start_time <= :endDate',
          {
            startDate,
            endDate,
          },
        )
        .select([
          'stakingEvents.wallet_address as wallet_address',
          'SUM(CAST(stakingEvents.amount AS DECIMAL)) as stake_amount',
        ])
        .groupBy('stakingEvents.wallet_address')
        .orderBy('stake_amount', 'DESC')
        .limit(5)
        .getRawMany();
      this.logger.log(
        `Retrieved top 5 stakers for period ${startDate}-${endDate}: ${result.length} records`,
      );
      return result;
    } catch (error) {
      this.logger.error('Failed to get top 5 stakers', error);
      throw new InternalServerErrorException('Failed to retrieve top stakers');
    }
  }

  async getTokenVelocity(
    query: GetStakeInfoDto,
  ): Promise<{ tokenVelocity: string }> {
    try {
      this.validateDateRange(query);
      const { startDate, endDate } = query;
      const result = await this.dataSource
        .createQueryBuilder(StakingEventEntity, 'stakingEvents')
        .where(
          'stakingEvents.start_time >= :startDate AND stakingEvents.start_time <= :endDate',
          {
            startDate,
            endDate,
          },
        )
        .andWhere('stakingEvents.has_withdrawal = true')
        .andWhere('stakingEvents.withdrawal_time > stakingEvents.start_time')
        .setParameter('secondsInDay', SECS_PER_DAY)
        .setParameter('milliPerSec', MILLI_SECS_PER_SEC)
        .select(
          '(SUM(stakingEvents.withdrawal_time / CAST(:milliPerSec AS NUMERIC)) - SUM(stakingEvents.start_time / CAST(:milliPerSec AS NUMERIC))) / CAST(:secondsInDay AS NUMERIC) as average_hold_duration_days',
        )
        .getRawOne();
      this.logger.log(
        `Token velocity for period ${startDate}-${endDate}: ${result?.average_hold_duration_days || 0}`,
      );
      return {
        tokenVelocity: result?.average_hold_duration_days || '0',
      };
    } catch (error) {
      this.logger.error('Failed to get token velocity', error);
      throw new InternalServerErrorException(
        'Failed to retrieve token velocity',
      );
    }
  }

  async getStakingMovement(
    query: GetStakeInfoDto,
  ): Promise<Array<{ stakeamount: string; date: string }>> {
    try {
      this.validateDateRange(query);
      const { startDate, endDate } = query;
      const result = await this.dataSource
        .createQueryBuilder(StakingEventEntity, 'stakingEvents')
        .where(
          'stakingEvents.start_time >= :startDate AND stakingEvents.start_time <= :endDate',
          {
            startDate,
            endDate,
          },
        )
        .select([
          'SUM(CAST(stakingEvents.amount AS DECIMAL)) as stakeamount',
          "DATE(to_timestamp(stakingEvents.start_time / 1000) AT TIME ZONE 'UTC') as date",
        ])
        .groupBy(
          "DATE(to_timestamp(stakingEvents.start_time / 1000) AT TIME ZONE 'UTC')",
        )
        .orderBy('date', 'ASC')
        .getRawMany();
      const movementData = this.generateCompleteDateRange(query, result);
      this.logger.log(
        `Generated staking movement data for period ${startDate}-${endDate}: ${movementData.length} days`,
      );
      return movementData;
    } catch (error) {
      this.logger.error('Failed to get staking movement', error);
      throw new InternalServerErrorException(
        'Failed to retrieve staking movement data',
      );
    }
  }

  create(createstakingEventDto: CreatestakingEventDto) {
    try {
      const result = this.stakingEventsRepository.create(createstakingEventDto);
      this.logger.log('Created staking event');
      return result;
    } catch (error) {
      this.logger.error('Failed to create staking event', error);
      throw new InternalServerErrorException('Failed to create staking event');
    }
  }

  async findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }) {
    try {
      const result = await this.stakingEventsRepository.findAllWithPagination({
        paginationOptions: {
          page: paginationOptions.page,
          limit: paginationOptions.limit,
        },
      });
      this.logger.log(
        `Retrieved staking events: page ${paginationOptions.page}, limit ${paginationOptions.limit}`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        'Failed to retrieve staking events with pagination',
        error,
      );
      throw new InternalServerErrorException(
        'Failed to retrieve staking events',
      );
    }
  }

  async findById(id: StakingEvent['id']) {
    try {
      if (!id) {
        throw new BadRequestException('Invalid staking event ID');
      }
      const result = await this.stakingEventsRepository.findById(id);
      if (!result) {
        this.logger.warn(`Staking event not found: ${id}`);
      }
      return result;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to find staking event by ID: ${id}`, error);
      throw new InternalServerErrorException(
        'Failed to retrieve staking event',
      );
    }
  }

  async findByIds(ids: StakingEvent['id'][]) {
    try {
      if (!Array.isArray(ids) || ids.length === 0) {
        return [];
      }
      const validIds = ids.filter((id) => id != null);
      if (validIds.length === 0) {
        return [];
      }
      const result = await this.stakingEventsRepository.findByIds(validIds);
      this.logger.log(
        `Retrieved ${result.length} staking events from ${validIds.length} requested IDs`,
      );
      return result;
    } catch (error) {
      this.logger.error('Failed to find staking events by IDs', error);
      throw new InternalServerErrorException(
        'Failed to retrieve staking events',
      );
    }
  }

  async findLatestStake() {
    try {
      const result = await this.stakingEventsRepository.findLatestStake();
      if (result) {
        this.logger.log('Found latest stake');
      } else {
        this.logger.log('No staking events found');
      }
      return result;
    } catch (error) {
      this.logger.error('Failed to find latest stake', error);
      throw new InternalServerErrorException('Failed to retrieve latest stake');
    }
  }

  async getStakeByIndex(stakeIndex: number, walletAddress: string) {
    try {
      if (typeof stakeIndex !== 'number' || !walletAddress) {
        throw new BadRequestException('Invalid stake index or wallet address');
      }
      const result = await this.stakingEventsRepository.getStakeByIndex(
        stakeIndex,
        walletAddress,
      );
      if (!result) {
        this.logger.warn(
          `Stake not found for index ${stakeIndex} and wallet ${walletAddress}`,
        );
      }
      return result;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(
        `Failed to get stake by index: ${stakeIndex}, wallet: ${walletAddress}`,
        error,
      );
      throw new InternalServerErrorException(
        'Failed to retrieve stake by index',
      );
    }
  }

  async update(
    id: StakingEvent['id'],
    updateStakingEventDto: UpdateStakingEventDto,
  ) {
    try {
      if (!id) {
        throw new BadRequestException('Invalid staking event ID');
      }
      const result = await this.stakingEventsRepository.update(
        id,
        updateStakingEventDto,
      );
      this.logger.log(`Updated staking event: ${id}`);
      return result;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to update staking event: ${id}`, error);
      throw new InternalServerErrorException('Failed to update staking event');
    }
  }

  async remove(id: StakingEvent['id']) {
    try {
      if (!id) {
        throw new BadRequestException('Invalid staking event ID');
      }
      await this.stakingEventsRepository.remove(id);
      this.logger.log(`Removed staking event: ${id}`);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to remove staking event: ${id}`, error);
      throw new InternalServerErrorException('Failed to remove staking event');
    }
  }

  private validateDateRange(query: GetStakeInfoDto): void {
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
    query: GetStakeInfoDto,
    result: Array<{ stakeamount: string; date: string }>,
  ): Array<{ stakeamount: string; date: string }> {
    const stakesByDate: { [key: string]: string } = {};
    result.forEach((row) => {
      const dateKey = new Date(row.date).toISOString().split('T')[0];
      stakesByDate[dateKey] = row.stakeamount;
    });
    const finalResult: Array<{ stakeamount: string; date: string }> = [];
    const start = new Date(Number(query.startDate));
    const end = new Date(Number(query.endDate));
    const daysDiff = Math.ceil(
      (end.getTime() - start.getTime()) / (MILLI_SECS_PER_SEC * SECS_PER_DAY),
    );
    for (let i = 0; i <= daysDiff; i++) {
      const currentDate = new Date(start);
      currentDate.setDate(start.getDate() + i);
      const dateKey = currentDate.toISOString().split('T')[0];
      const stakeAmount = stakesByDate[dateKey] || '0';
      finalResult.push({
        stakeamount: stakeAmount,
        date: currentDate.toISOString(),
      });
    }
    return finalResult;
  }
}
