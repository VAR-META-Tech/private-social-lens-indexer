import { DeepPartial } from '../../../utils/types/deep-partial.type';
import { NullableType } from '../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../utils/types/pagination-options';
import { RequestReward } from '../../domain/request-reward';

export abstract class RequestRewardRepository {
  abstract create(
    data: Omit<RequestReward, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<RequestReward>;

  abstract findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }): Promise<RequestReward[]>;

  abstract findById(
    id: RequestReward['id'],
  ): Promise<NullableType<RequestReward>>;

  abstract findByIds(ids: RequestReward['id'][]): Promise<RequestReward[]>;

  abstract findLatestRequestReward(): Promise<RequestReward | null>;

  abstract update(
    id: RequestReward['id'],
    payload: DeepPartial<RequestReward>,
  ): Promise<RequestReward | null>;

  abstract remove(id: RequestReward['id']): Promise<void>;
}
