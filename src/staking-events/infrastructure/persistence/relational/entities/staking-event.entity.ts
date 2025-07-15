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
  tx_hash: string;

  @Column()
  wallet_address: string;

  @Column({ type: 'numeric' })
  amount: string;

  @Column({ type: 'numeric' })
  duration: string;

  @Column({ type: 'boolean' })
  has_withdrawal: boolean;

  @Column({ type: 'numeric', nullable: true })
  withdrawal_time: string | null;

  @Column({ type: 'numeric' })
  start_time: string;

  @Column({ type: 'numeric' })
  block_number: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
