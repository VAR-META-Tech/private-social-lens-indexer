import { Module } from '@nestjs/common';
import { StakingEventsRepository } from '../staking-events.repository';
import { StakingEventsRelationalRepository } from './repositories/staking-event.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StakingEventEntity } from './entities/staking-event.entity';

@Module({
  imports: [TypeOrmModule.forFeature([StakingEventEntity])],
  providers: [
    {
      provide: StakingEventsRepository,
      useClass: StakingEventsRelationalRepository,
    },
  ],
  exports: [StakingEventsRepository],
})
export class RelationalStakingEventPersistenceModule {}
