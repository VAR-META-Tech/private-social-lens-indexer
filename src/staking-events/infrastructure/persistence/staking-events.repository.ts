import { DeepPartial } from '../../../utils/types/deep-partial.type';
import { NullableType } from '../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../utils/types/pagination-options';
import { StakingEvent } from '../../domain/staking-event';

export abstract class StakingEventsRepository {
  abstract create(
    data: Omit<StakingEvent, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<StakingEvent>;

  abstract findLatestStake(): Promise<StakingEvent | null>;

  abstract getStakeByIndex(
    stakeIndex: number,
    walletAddress: string,
  ): Promise<StakingEvent | null>;

  abstract findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }): Promise<StakingEvent[]>;

  abstract findById(
    id: StakingEvent['id'],
  ): Promise<NullableType<StakingEvent>>;

  abstract findByIds(ids: StakingEvent['id'][]): Promise<StakingEvent[]>;

  abstract update(
    id: StakingEvent['id'],
    payload: DeepPartial<StakingEvent>,
  ): Promise<StakingEvent | null>;

  abstract remove(id: StakingEvent['id']): Promise<void>;
}
