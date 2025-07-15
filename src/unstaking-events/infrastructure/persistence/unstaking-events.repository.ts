import { DeepPartial } from '../../../utils/types/deep-partial.type';
import { NullableType } from '../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../utils/types/pagination-options';
import { UnstakingEvent } from '../../domain/unstaking-event';

export abstract class UnstakingEventRepository {
  abstract create(
    data: Omit<UnstakingEvent, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<UnstakingEvent>;

  abstract findLatestUnstake(): Promise<NullableType<UnstakingEvent>>;

  abstract findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }): Promise<UnstakingEvent[]>;

  abstract findById(
    id: UnstakingEvent['id'],
  ): Promise<NullableType<UnstakingEvent>>;

  abstract findByIds(ids: UnstakingEvent['id'][]): Promise<UnstakingEvent[]>;

  abstract update(
    id: UnstakingEvent['id'],
    payload: DeepPartial<UnstakingEvent>,
  ): Promise<UnstakingEvent | null>;

  abstract remove(id: UnstakingEvent['id']): Promise<void>;
}
