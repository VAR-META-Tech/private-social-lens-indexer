import { StakingEvent } from '../../../../domain/staking-event';
import { StakingEventEntity } from '../entities/staking-event.entity';

export class StakingEventMapper {
  static toDomain(raw: StakingEventEntity): StakingEvent {
    const domainEntity = new StakingEvent();
    domainEntity.id = raw.id;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;
    domainEntity.txHash = raw.txHash;
    domainEntity.walletAddress = raw.walletAddress;
    domainEntity.amount = raw.amount;
    domainEntity.duration = raw.duration;
    domainEntity.startTime = raw.startTime;
    domainEntity.blockNumber = raw.blockNumber;
    domainEntity.hasWithdrawal = raw.hasWithdrawal;
    domainEntity.withdrawalTime = raw.withdrawalTime;

    return domainEntity;
  }

  static toPersistence(domainEntity: StakingEvent): StakingEventEntity {
    const persistenceEntity = new StakingEventEntity();
    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }
    persistenceEntity.createdAt = domainEntity.createdAt;
    persistenceEntity.updatedAt = domainEntity.updatedAt;
    persistenceEntity.txHash = domainEntity.txHash;
    persistenceEntity.walletAddress = domainEntity.walletAddress;
    persistenceEntity.amount = domainEntity.amount;
    persistenceEntity.duration = domainEntity.duration;
    persistenceEntity.startTime = domainEntity.startTime;
    persistenceEntity.blockNumber = domainEntity.blockNumber;
    persistenceEntity.hasWithdrawal = domainEntity.hasWithdrawal;
    persistenceEntity.withdrawalTime = domainEntity.withdrawalTime;

    return persistenceEntity;
  }
}
