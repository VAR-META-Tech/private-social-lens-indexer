import { Module } from '@nestjs/common';
import { UnstakingEventRepository } from '../unstaking-events.repository';
import { UnstakingEventRelationalRepository } from './repositories/unstaking-event.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UnstakingEventEntity } from './entities/unstaking-event.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UnstakingEventEntity])],
  providers: [
    {
      provide: UnstakingEventRepository,
      useClass: UnstakingEventRelationalRepository,
    },
  ],
  exports: [UnstakingEventRepository],
})
export class RelationalUnstakingEventPersistenceModule {}
