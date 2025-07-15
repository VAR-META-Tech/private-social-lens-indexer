import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';

@Entity({
  name: 'unstaking_events',
})
export class UnstakingEventEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tx_hash: string;

  @Column()
  wallet_address: string;

  @Column({ type: 'numeric' })
  amount: string;

  @Column({ type: 'numeric' })
  block_number: string;

  @Column({ type: 'numeric' })
  unstake_time: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
