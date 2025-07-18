import {
  // common
  Logger,
  InternalServerErrorException,
  Injectable,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CreateRequestRewardDto } from './dto/create-request-reward.dto';
import { UpdateRequestRewardDto } from './dto/update-request-reward.dto';
import { RequestRewardRepository } from './infrastructure/persistence/request-reward.repository';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { RequestReward } from './domain/request-reward';
import { GetTokenEmissionDto } from './dto/get-token-emission-dto';
import { MILLI_SECS_PER_SEC, SECS_PER_DAY } from '../utils/const';
import { RequestRewardEntity } from './infrastructure/persistence/relational/entities/request-reward.entity';
import { getFromDate, getToDate } from '../utils/helper';

@Injectable()
export class RequestRewardsService {
  private readonly logger = new Logger(RequestRewardsService.name);

  constructor(
    private readonly requestRewardRepository: RequestRewardRepository,
    private readonly dataSource: DataSource,
  ) {}

  async getTokenEmissionMovement(
    query: GetTokenEmissionDto,
  ): Promise<Array<{ reqrewardamount: string; date: string }>> {
    try {
      const { startDate, endDate } = query;
      const fromDate = getFromDate(startDate);
      const toDate = getToDate(endDate);

      const result = await this.dataSource
        .createQueryBuilder(RequestRewardEntity, 'requestRewards')
        .where(
          'requestRewards.blockTimestamp >= :startDate AND requestRewards.blockTimestamp <= :endDate',
          { startDate: fromDate, endDate: toDate },
        )
        .select([
          'SUM(CAST(requestRewards.rewardAmount AS DECIMAL)) as reqrewardamount',
          "DATE(to_timestamp(requestRewards.blockTimestamp / 1000) AT TIME ZONE 'UTC') as date",
        ])
        .groupBy(
          "DATE(to_timestamp(requestRewards.blockTimestamp / 1000) AT TIME ZONE 'UTC')",
        )
        .orderBy('date', 'ASC')
        .getRawMany();

      const movementData = this.generateCompleteDateRange(
        fromDate,
        toDate,
        result,
      );

      this.logger.log(
        `Generated token emission movement data for period ${startDate}-${endDate}: ${movementData.length} days`,
      );
      return movementData;
    } catch (error) {
      this.logger.error('Failed to get token emission movement', error);
      throw new InternalServerErrorException(
        'Failed to retrieve token emission movement data',
      );
    }
  }

  private generateCompleteDateRange(
    fromDate: number,
    toDate: number,
    result: Array<{ reqrewardamount: string; date: string }>,
  ): Array<{ reqrewardamount: string; date: string }> {
    const reqRewardAmountByDate = result.reduce(
      (acc, row) => {
        const dateKey = new Date(row.date).toISOString().split('T')[0];
        acc[dateKey] = row.reqrewardamount;
        return acc;
      },
      {} as { [key: string]: string },
    );

    const daysDiff = Math.ceil(
      (toDate - fromDate) / (MILLI_SECS_PER_SEC * SECS_PER_DAY),
    );

    return Array.from({ length: daysDiff }, (_, i) => {
      const currentDate = new Date(fromDate);
      currentDate.setDate(currentDate.getDate() + i);
      const dateKey = currentDate.toISOString().split('T')[0];

      return {
        reqrewardamount: reqRewardAmountByDate[dateKey] || '0',
        date: currentDate.toISOString(),
      };
    });
  }

  async create(createRequestRewardDto: CreateRequestRewardDto) {
    return this.requestRewardRepository.create(createRequestRewardDto);
  }

  findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }) {
    return this.requestRewardRepository.findAllWithPagination({
      paginationOptions: {
        page: paginationOptions.page,
        limit: paginationOptions.limit,
      },
    });
  }

  findById(id: RequestReward['id']) {
    return this.requestRewardRepository.findById(id);
  }

  findByIds(ids: RequestReward['id'][]) {
    return this.requestRewardRepository.findByIds(ids);
  }

  findLatestRequestReward() {
    return this.requestRewardRepository.findLatestRequestReward();
  }

  async update(
    id: RequestReward['id'],
    updateRequestRewardDto: UpdateRequestRewardDto,
  ) {
    return this.requestRewardRepository.update(id, updateRequestRewardDto);
  }

  remove(id: RequestReward['id']) {
    return this.requestRewardRepository.remove(id);
  }
}
