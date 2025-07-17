import { Controller, Get, Query } from '@nestjs/common';
import { StakingEventsService } from './staking-events.service';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { StakingEvent } from './domain/staking-event';
import { InfinityPaginationResponse } from '../utils/dto/infinity-pagination-response.dto';
import { GetStakeInfoDto } from './dto/get-stake-info.dto';

@ApiTags('Staking Events')
@ApiBearerAuth()
@Controller({
  path: 'staking-events',
  version: '1',
})
export class StakingEventsController {
  constructor(private readonly stakingEventsService: StakingEventsService) {}

  @Get('token-flow-info')
  @ApiOkResponse({
    type: InfinityPaginationResponse(StakingEvent),
  })
  async getTokenFlowInfo(@Query() query: GetStakeInfoDto): Promise<any> {
    return await this.stakingEventsService.getTokenFlowInfo(query);
  }

  @Get('top-5-stakers')
  @ApiOkResponse({
    type: InfinityPaginationResponse(StakingEvent),
  })
  async getTop5Stakers(@Query() query: GetStakeInfoDto): Promise<any> {
    return await this.stakingEventsService.getTop5Stakers(query);
  }

  @Get('token-velocity')
  @ApiOkResponse({
    type: InfinityPaginationResponse(StakingEvent),
  })
  async getTokenVelocity(@Query() query: GetStakeInfoDto): Promise<any> {
    return await this.stakingEventsService.getTokenVelocity(query);
  }

  @Get('get-staking-movement')
  getStakingMovement(@Query() query: GetStakeInfoDto) {
    return this.stakingEventsService.getStakingMovement(query);
  }
}
