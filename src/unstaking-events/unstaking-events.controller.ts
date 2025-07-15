import { Controller, Get, Query } from '@nestjs/common';
import { UnstakingEventsService } from './unstaking-events.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { GetUnstakeInfoDto } from './dto/get-unstake-info.dto';
// import { AuthGuard } from '@nestjs/passport';

@ApiTags('Unstaking Events')
@ApiBearerAuth()
// @UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'unstaking-events',
  version: '1',
})
export class UnstakingEventsController {
  constructor(
    private readonly unstakingEventsService: UnstakingEventsService,
  ) {}

  @Get('get-top-5-unstakers')
  getTop5Unstakers(@Query() query: GetUnstakeInfoDto) {
    return this.unstakingEventsService.getTop5Unstakers(query);
  }

  @Get('get-unstaking-movement')
  getUnstakingMovement(@Query() query: GetUnstakeInfoDto) {
    return this.unstakingEventsService.getUnstakingMovement(query);
  }
}
