import {
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Column,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';

@Entity({
  name: 'staking_events',
})
export class StakingEventEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  txHash: string;

  @Column()
  walletAddress: string;

  @Column({ type: 'numeric' })
  amount: string;

  @Column({ type: 'numeric' })
  duration: string;

  @Column({ type: 'boolean' })
  hasWithdrawal: boolean;

  @Column({ type: 'numeric', nullable: true })
  withdrawalTime: string | null;

  @Column({ type: 'numeric' })
  startTime: string;

  @Column({ type: 'numeric' })
  blockNumber: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
