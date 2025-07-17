import {
  // do not remove this comment
  Module,
} from '@nestjs/common';
import { UnstakingEventsService } from './unstaking-events.service';
import { UnstakingEventsController } from './unstaking-events.controller';
import { RelationalUnstakingEventPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';

@Module({
  imports: [
    // do not remove this comment
    RelationalUnstakingEventPersistenceModule,
  ],
  controllers: [UnstakingEventsController],
  providers: [UnstakingEventsService],
  exports: [UnstakingEventsService, RelationalUnstakingEventPersistenceModule],
})
export class UnstakingEventsModule {}
