import { UnstakingEvent } from '../../../../domain/unstaking-event';
import { UnstakingEventEntity } from '../entities/unstaking-event.entity';

export class UnstakingEventMapper {
  static toDomain(raw: UnstakingEventEntity): UnstakingEvent {
    const domainEntity = new UnstakingEvent();
    domainEntity.id = raw.id;
    domainEntity.tx_hash = raw.tx_hash;
    domainEntity.wallet_address = raw.wallet_address;
    domainEntity.amount = raw.amount;
    domainEntity.block_number = raw.block_number;
    domainEntity.unstake_time = raw.unstake_time;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;

    return domainEntity;
  }

  static toPersistence(domainEntity: UnstakingEvent): UnstakingEventEntity {
    const persistenceEntity = new UnstakingEventEntity();
    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }
    persistenceEntity.tx_hash = domainEntity.tx_hash;
    persistenceEntity.wallet_address = domainEntity.wallet_address;
    persistenceEntity.amount = domainEntity.amount;
    persistenceEntity.block_number = domainEntity.block_number;
    persistenceEntity.unstake_time = domainEntity.unstake_time;
    persistenceEntity.createdAt = domainEntity.createdAt;
    persistenceEntity.updatedAt = domainEntity.updatedAt;

    return persistenceEntity;
  }
}
