import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { StakingEventEntity } from '../entities/staking-event.entity';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { StakingEvent } from '../../../../domain/staking-event';
import { StakingEventsRepository } from '../../staking-events.repository';
import { StakingEventMapper } from '../mappers/staking-event.mapper';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';

@Injectable()
export class StakingEventsRelationalRepository
  implements StakingEventsRepository
{
  constructor(
    @InjectRepository(StakingEventEntity)
    private readonly stakingEventsRepository: Repository<StakingEventEntity>,
  ) {}

  async create(data: StakingEvent): Promise<StakingEvent> {
    const persistenceModel = StakingEventMapper.toPersistence(data);
    const newEntity = await this.stakingEventsRepository.upsert(
      persistenceModel,
      ['txHash'],
    );
    return StakingEventMapper.toDomain(newEntity.raw[0]);
  }

  async findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }): Promise<StakingEvent[]> {
    const entities = await this.stakingEventsRepository.find({
      skip: (paginationOptions.page - 1) * paginationOptions.limit,
      take: paginationOptions.limit,
    });

    return entities.map((entity) => StakingEventMapper.toDomain(entity));
  }

  async findLatestStake(): Promise<StakingEvent | null> {
    const entities = await this.stakingEventsRepository.find({
      order: { blockNumber: 'DESC' },
    });

    return entities.length > 0
      ? StakingEventMapper.toDomain(entities[0])
      : null;
  }

  async getStakeByIndex(
    stakeIndex: number,
    walletAddress: string,
  ): Promise<StakingEvent | null> {
    const entities = await this.stakingEventsRepository.find({
      where: { walletAddress: walletAddress },
    });

    const entity = entities.find((_entity, index) => index === stakeIndex);

    return entity ? StakingEventMapper.toDomain(entity) : null;
  }

  async findById(id: StakingEvent['id']): Promise<NullableType<StakingEvent>> {
    const entity = await this.stakingEventsRepository.findOne({
      where: { id },
    });

    return entity ? StakingEventMapper.toDomain(entity) : null;
  }

  async findByIds(ids: StakingEvent['id'][]): Promise<StakingEvent[]> {
    const entities = await this.stakingEventsRepository.find({
      where: { id: In(ids) },
    });

    return entities.map((entity) => StakingEventMapper.toDomain(entity));
  }

  async update(
    id: StakingEvent['id'],
    payload: Partial<StakingEvent>,
  ): Promise<StakingEvent> {
    const entity = await this.stakingEventsRepository.findOne({
      where: { id },
    });

    if (!entity) {
      throw new Error('Record not found');
    }

    const updatedEntity = await this.stakingEventsRepository.save(
      this.stakingEventsRepository.create(
        StakingEventMapper.toPersistence({
          ...StakingEventMapper.toDomain(entity),
          ...payload,
        }),
      ),
    );

    return StakingEventMapper.toDomain(updatedEntity);
  }

  async remove(id: StakingEvent['id']): Promise<void> {
    await this.stakingEventsRepository.delete(id);
  }
}
