import { Module } from '@nestjs/common';
import { CheckpointRepository } from '../checkpoint.repository';
import { CheckpointRelationalRepository } from './repositories/checkpoint.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CheckpointEntity } from './entities/checkpoint.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CheckpointEntity])],
  providers: [
    {
      provide: CheckpointRepository,
      useClass: CheckpointRelationalRepository,
    },
  ],
  exports: [CheckpointRepository],
})
export class RelationalCheckpointPersistenceModule {}
