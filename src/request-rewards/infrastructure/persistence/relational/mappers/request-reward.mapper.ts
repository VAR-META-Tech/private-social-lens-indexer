import { RequestReward } from '../../../../domain/request-reward';
import { RequestRewardEntity } from '../entities/request-reward.entity';

export class RequestRewardMapper {
  static toDomain(raw: RequestRewardEntity): RequestReward {
    const domainEntity = new RequestReward();
    domainEntity.id = raw.id;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;
    domainEntity.blockNumber = raw.blockNumber;
    domainEntity.contributorAddress = raw.contributorAddress;
    domainEntity.rewardAmount = raw.rewardAmount;
    domainEntity.fileId = raw.fileId;
    domainEntity.proofIndex = raw.proofIndex;
    domainEntity.txHash = raw.txHash;
    domainEntity.blockTimestamp = raw.blockTimestamp;

    return domainEntity;
  }

  static toPersistence(domainEntity: RequestReward): RequestRewardEntity {
    const persistenceEntity = new RequestRewardEntity();
    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }
    persistenceEntity.createdAt = domainEntity.createdAt;
    persistenceEntity.updatedAt = domainEntity.updatedAt;
    persistenceEntity.blockNumber = domainEntity.blockNumber;
    persistenceEntity.contributorAddress = domainEntity.contributorAddress;
    persistenceEntity.rewardAmount = domainEntity.rewardAmount;
    persistenceEntity.fileId = domainEntity.fileId;
    persistenceEntity.proofIndex = domainEntity.proofIndex;
    persistenceEntity.txHash = domainEntity.txHash;
    persistenceEntity.blockTimestamp = domainEntity.blockTimestamp;

    return persistenceEntity;
  }
}
