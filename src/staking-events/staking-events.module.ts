import {
  // do not remove this comment
  Module,
} from '@nestjs/common';
import { StakingEventsService } from './staking-events.service';
import { StakingEventsController } from './staking-events.controller';
import { RelationalStakingEventPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';
import { UnstakingEventsModule } from '../unstaking-events/unstaking-events.module';

@Module({
  imports: [
    // do not remove this comment
    RelationalStakingEventPersistenceModule,
    UnstakingEventsModule,
  ],
  controllers: [StakingEventsController],
  providers: [StakingEventsService],
  exports: [StakingEventsService, RelationalStakingEventPersistenceModule],
})
export class StakingEventsModule {}
