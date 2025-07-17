import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { EntityRelationalHelper } from '../../../../../utils/relational-entity-helper';
import { QueryType } from '../../../../../utils/common.type';

@Entity({
  name: 'checkpoint',
})
export class CheckpointEntity extends EntityRelationalHelper {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'numeric',
  })
  blockNumber: number;

  @Column({
    type: 'numeric',
  })
  blockTimestamp: number;

  @Column({
    type: 'enum',
    enum: QueryType,
  })
  queryType: QueryType;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
