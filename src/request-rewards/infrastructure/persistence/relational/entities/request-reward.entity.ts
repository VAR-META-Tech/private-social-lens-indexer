import {
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Column,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';

@Entity({
  name: 'request_reward',
})
export class RequestRewardEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'numeric' })
  blockNumber: string;

  @Column()
  contributorAddress: string;

  @Column({ type: 'numeric' })
  rewardAmount: string;

  @Column({ type: 'numeric' })
  fileId: string;

  @Column({ type: 'numeric' })
  proofIndex: string;

  @Column({ unique: true })
  txHash: string;

  @Column({ type: 'numeric' })
  blockTimestamp: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
