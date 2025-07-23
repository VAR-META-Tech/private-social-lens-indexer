import {
  // common
  Module,
} from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { StakingFetchService } from './staking/staking-fetch.service';
import { Web3Service } from '../web3/web3.service';
import { StakingEventsModule } from '../staking-events/staking-events.module';
import { UnstakingEventsModule } from '../unstaking-events/unstaking-events.module';
import { UnstakingFetchService } from './staking/unstaking-fetch.service';
import { WorkerService } from './worker.service';
import { ReqRewardFetchService } from './contributor/req-reward-fetch.service';
import { RequestRewardsModule } from '../request-rewards/request-rewards.module';
import { CheckpointsModule } from '../checkpoints/checkpoints.module';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        return {
          connection: {
            host: configService.get<string>('app.workerConfig.redisHost', {
              infer: true,
            }),
            port: configService.get<number>('app.workerConfig.redisPort', {
              infer: true,
            }),
            retryDelayOnFailover: 1000,
          },
        };
      },
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: 'blockchain-index-event',
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    }),
    StakingEventsModule,
    UnstakingEventsModule,
    RequestRewardsModule,
    CheckpointsModule,
  ],
  providers: [
    Web3Service,
    StakingFetchService,
    UnstakingFetchService,
    ReqRewardFetchService,
    WorkerService,
  ],
  exports: [WorkerService],
})
export class WorkerModule {}
