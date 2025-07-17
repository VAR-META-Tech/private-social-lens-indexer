import { Controller, Get, Query } from '@nestjs/common';
import { RequestRewardsService } from './request-rewards.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { GetTokenEmissionDto } from './dto/get-token-emission-dto';

@ApiTags('Request Rewards')
@ApiBearerAuth()
// @UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'request-rewards',
  version: '1',
})
export class RequestRewardsController {
  constructor(private readonly requestRewardsService: RequestRewardsService) {}

  @Get('get-token-emission-movement')
  async getTokenEmissionMovement(@Query() query: GetTokenEmissionDto) {
    return await this.requestRewardsService.getTokenEmissionMovement(query);
  }
}
