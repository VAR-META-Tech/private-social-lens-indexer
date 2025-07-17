import { Module } from '@nestjs/common';
import { RequestRewardRepository } from '../request-reward.repository';
import { RequestRewardRelationalRepository } from './repositories/request-reward.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RequestRewardEntity } from './entities/request-reward.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RequestRewardEntity])],
  providers: [
    {
      provide: RequestRewardRepository,
      useClass: RequestRewardRelationalRepository,
    },
  ],
  exports: [RequestRewardRepository],
})
export class RelationalRequestRewardPersistenceModule {}
