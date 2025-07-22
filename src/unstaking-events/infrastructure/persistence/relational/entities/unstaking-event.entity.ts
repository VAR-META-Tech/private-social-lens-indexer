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

  @Column({ unique: true })
  txHash: string;

  @Column()
  walletAddress: string;

  @Column({ type: 'numeric' })
  amount: string;

  @Column({ type: 'numeric' })
  blockNumber: string;

  @Column({ type: 'numeric' })
  unstakeTime: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
