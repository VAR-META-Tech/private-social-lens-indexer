import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { RequestRewardEntity } from '../entities/request-reward.entity';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { RequestReward } from '../../../../domain/request-reward';
import { RequestRewardRepository } from '../../request-reward.repository';
import { RequestRewardMapper } from '../mappers/request-reward.mapper';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';

@Injectable()
export class RequestRewardRelationalRepository
  implements RequestRewardRepository
{
  constructor(
    @InjectRepository(RequestRewardEntity)
    private readonly requestRewardRepository: Repository<RequestRewardEntity>,
  ) {}

  async create(data: RequestReward): Promise<RequestReward> {
    const persistenceModel = RequestRewardMapper.toPersistence(data);
    const newEntity = await this.requestRewardRepository.save(
      this.requestRewardRepository.create(persistenceModel),
    );
    return RequestRewardMapper.toDomain(newEntity);
  }

  async findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }): Promise<RequestReward[]> {
    const entities = await this.requestRewardRepository.find({
      skip: (paginationOptions.page - 1) * paginationOptions.limit,
      take: paginationOptions.limit,
    });

    return entities.map((entity) => RequestRewardMapper.toDomain(entity));
  }

  async findById(
    id: RequestReward['id'],
  ): Promise<NullableType<RequestReward>> {
    const entity = await this.requestRewardRepository.findOne({
      where: { id },
    });

    return entity ? RequestRewardMapper.toDomain(entity) : null;
  }

  async findByIds(ids: RequestReward['id'][]): Promise<RequestReward[]> {
    const entities = await this.requestRewardRepository.find({
      where: { id: In(ids) },
    });

    return entities.map((entity) => RequestRewardMapper.toDomain(entity));
  }

  async findLatestRequestReward(): Promise<RequestReward | null> {
    const entities = await this.requestRewardRepository.find({
      order: { blockNumber: 'DESC' },
    });

    return entities.length > 0
      ? RequestRewardMapper.toDomain(entities[0])
      : null;
  }

  async update(
    id: RequestReward['id'],
    payload: Partial<RequestReward>,
  ): Promise<RequestReward> {
    const entity = await this.requestRewardRepository.findOne({
      where: { id },
    });

    if (!entity) {
      throw new Error('Record not found');
    }

    const updatedEntity = await this.requestRewardRepository.save(
      this.requestRewardRepository.create(
        RequestRewardMapper.toPersistence({
          ...RequestRewardMapper.toDomain(entity),
          ...payload,
        }),
      ),
    );

    return RequestRewardMapper.toDomain(updatedEntity);
  }

  async remove(id: RequestReward['id']): Promise<void> {
    await this.requestRewardRepository.delete(id);
  }
}
