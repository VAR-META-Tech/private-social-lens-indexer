import {
  // common
  Module,
} from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { StakingFetchService } from './staking/staking-fetch.service';
import { Web3Service } from '../web3/web3.service';
import { StakingEventListenerService } from './staking/staking-event-listener.service';
import { StakingEventsModule } from '../staking-events/staking-events.module';
import { UnstakingEventsModule } from '../unstaking-events/unstaking-events.module';
import { UnstakingEventListenerService } from './staking/unstaking-event-listener.service';
import { UnstakingFetchService } from './staking/unstaking-fetch.service';
import { WorkerService } from './worker.service';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: 'localhost',
        port: 6379,
      },
    }),
    BullModule.registerQueue({
      name: 'blockchain-events',
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    }),
    StakingEventsModule,
    UnstakingEventsModule,
  ],
  providers: [
    Web3Service,
    StakingFetchService,
    UnstakingFetchService,
    StakingEventListenerService,
    UnstakingEventListenerService,
    WorkerService,
  ],
  exports: [WorkerService],
})
export class WorkerModule {}
