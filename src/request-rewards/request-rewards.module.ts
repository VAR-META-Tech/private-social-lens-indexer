import {
  // do not remove this comment
  Module,
} from '@nestjs/common';
import { RequestRewardsService } from './request-rewards.service';
import { RequestRewardsController } from './request-rewards.controller';
import { RelationalRequestRewardPersistenceModule } from './infrastructure/persistence/relational/relational-persistence.module';

@Module({
  imports: [
    // do not remove this comment
    RelationalRequestRewardPersistenceModule,
  ],
  controllers: [RequestRewardsController],
  providers: [RequestRewardsService],
  exports: [RequestRewardsService, RelationalRequestRewardPersistenceModule],
})
export class RequestRewardsModule {}
