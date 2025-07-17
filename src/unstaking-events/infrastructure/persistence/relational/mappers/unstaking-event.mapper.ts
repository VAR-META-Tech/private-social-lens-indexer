import { UnstakingEvent } from '../../../../domain/unstaking-event';
import { UnstakingEventEntity } from '../entities/unstaking-event.entity';

export class UnstakingEventMapper {
  static toDomain(raw: UnstakingEventEntity): UnstakingEvent {
    const domainEntity = new UnstakingEvent();
    domainEntity.id = raw.id;
    domainEntity.txHash = raw.txHash;
    domainEntity.walletAddress = raw.walletAddress;
    domainEntity.amount = raw.amount;
    domainEntity.blockNumber = raw.blockNumber;
    domainEntity.unstakeTime = raw.unstakeTime;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;

    return domainEntity;
  }

  static toPersistence(domainEntity: UnstakingEvent): UnstakingEventEntity {
    const persistenceEntity = new UnstakingEventEntity();
    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }
    persistenceEntity.txHash = domainEntity.txHash;
    persistenceEntity.walletAddress = domainEntity.walletAddress;
    persistenceEntity.amount = domainEntity.amount;
    persistenceEntity.blockNumber = domainEntity.blockNumber;
    persistenceEntity.unstakeTime = domainEntity.unstakeTime;
    persistenceEntity.createdAt = domainEntity.createdAt;
    persistenceEntity.updatedAt = domainEntity.updatedAt;

    return persistenceEntity;
  }
}
