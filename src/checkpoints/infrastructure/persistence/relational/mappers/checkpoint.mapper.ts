import { Checkpoint } from '../../../../domain/checkpoint';
import { CheckpointEntity } from '../entities/checkpoint.entity';

export class CheckpointMapper {
  static toDomain(raw: CheckpointEntity): Checkpoint {
    const domainEntity = new Checkpoint();
    domainEntity.id = raw.id;
    domainEntity.createdAt = raw.createdAt;
    domainEntity.updatedAt = raw.updatedAt;
    domainEntity.toBlockNumber = raw.toBlockNumber.toString();
    domainEntity.fromBlockNumber = raw.fromBlockNumber.toString();
    domainEntity.blockTimestamp = raw.blockTimestamp.toString();
    domainEntity.queryType = raw.queryType;
    domainEntity.isFailed = raw.isFailed;

    return domainEntity;
  }

  static toPersistence(domainEntity: Checkpoint): CheckpointEntity {
    const persistenceEntity = new CheckpointEntity();
    if (domainEntity.id) {
      persistenceEntity.id = domainEntity.id;
    }
    persistenceEntity.createdAt = domainEntity.createdAt;
    persistenceEntity.updatedAt = domainEntity.updatedAt;
    persistenceEntity.toBlockNumber = Number(domainEntity.toBlockNumber);
    persistenceEntity.fromBlockNumber = Number(domainEntity.fromBlockNumber);
    persistenceEntity.blockTimestamp = Number(domainEntity.blockTimestamp);
    persistenceEntity.queryType = domainEntity.queryType;
    persistenceEntity.isFailed = domainEntity.isFailed;

    return persistenceEntity;
  }
}
