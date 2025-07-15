import { StakingEvent } from '../../../../domain/staking-event';
import { StakingEventEntity } from '../entities/staking-event.entity';

export class StakingEventMapper {
  static toDomain(raw: StakingEventEntity): StakingEvent {
    const domainEntity = new StakingEvent();
    domainEntity.id = raw.id;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;
    domainEntity.tx_hash = raw.tx_hash;
    domainEntity.wallet_address = raw.wallet_address;
    domainEntity.amount = raw.amount;
    domainEntity.duration = raw.duration;
    domainEntity.start_time = raw.start_time;
    domainEntity.block_number = raw.block_number;
    domainEntity.has_withdrawal = raw.has_withdrawal;
    domainEntity.withdrawal_time = raw.withdrawal_time;

    return domainEntity;
  }

  static toPersistence(domainEntity: StakingEvent): StakingEventEntity {
    const persistenceEntity = new StakingEventEntity();
    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }
    persistenceEntity.createdAt = domainEntity.createdAt;
    persistenceEntity.updatedAt = domainEntity.updatedAt;
    persistenceEntity.tx_hash = domainEntity.tx_hash;
    persistenceEntity.wallet_address = domainEntity.wallet_address;
    persistenceEntity.amount = domainEntity.amount;
    persistenceEntity.duration = domainEntity.duration;
    persistenceEntity.start_time = domainEntity.start_time;
    persistenceEntity.block_number = domainEntity.block_number;
    persistenceEntity.has_withdrawal = domainEntity.has_withdrawal;
    persistenceEntity.withdrawal_time = domainEntity.withdrawal_time;

    return persistenceEntity;
  }
}
