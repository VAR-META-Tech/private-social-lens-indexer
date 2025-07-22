import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { UnstakingEventEntity } from '../entities/unstaking-event.entity';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { UnstakingEvent } from '../../../../domain/unstaking-event';
import { UnstakingEventRepository } from '../../unstaking-events.repository';
import { UnstakingEventMapper } from '../mappers/unstaking-event.mapper';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';

@Injectable()
export class UnstakingEventRelationalRepository
  implements UnstakingEventRepository
{
  constructor(
    @InjectRepository(UnstakingEventEntity)
    private readonly unstakingEventsRepository: Repository<UnstakingEventEntity>,
  ) {}

  async create(data: UnstakingEvent): Promise<UnstakingEvent> {
    const persistenceModel = UnstakingEventMapper.toPersistence(data);
    const newEntity = await this.unstakingEventsRepository.upsert(
      persistenceModel,
      ['txHash'],
    );
    return UnstakingEventMapper.toDomain(newEntity.raw[0]);
  }

  async findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }): Promise<UnstakingEvent[]> {
    const entities = await this.unstakingEventsRepository.find({
      skip: (paginationOptions.page - 1) * paginationOptions.limit,
      take: paginationOptions.limit,
    });

    return entities.map((entity) => UnstakingEventMapper.toDomain(entity));
  }

  async findById(
    id: UnstakingEvent['id'],
  ): Promise<NullableType<UnstakingEvent>> {
    const entity = await this.unstakingEventsRepository.findOne({
      where: { id },
    });

    return entity ? UnstakingEventMapper.toDomain(entity) : null;
  }

  async findByIds(ids: UnstakingEvent['id'][]): Promise<UnstakingEvent[]> {
    const entities = await this.unstakingEventsRepository.find({
      where: { id: In(ids) },
    });

    return entities.map((entity) => UnstakingEventMapper.toDomain(entity));
  }

  async update(
    id: UnstakingEvent['id'],
    payload: Partial<UnstakingEvent>,
  ): Promise<UnstakingEvent> {
    const entity = await this.unstakingEventsRepository.findOne({
      where: { id },
    });

    if (!entity) {
      throw new Error('Record not found');
    }

    const updatedEntity = await this.unstakingEventsRepository.save(
      this.unstakingEventsRepository.create(
        UnstakingEventMapper.toPersistence({
          ...UnstakingEventMapper.toDomain(entity),
          ...payload,
        }),
      ),
    );

    return UnstakingEventMapper.toDomain(updatedEntity);
  }

  async remove(id: UnstakingEvent['id']): Promise<void> {
    await this.unstakingEventsRepository.delete(id);
  }

  async findLatestUnstake(): Promise<UnstakingEvent | null> {
    const entities = await this.unstakingEventsRepository.find({
      order: { blockNumber: 'DESC' },
    });

    return entities.length > 0
      ? UnstakingEventMapper.toDomain(entities[0])
      : null;
  }
}
