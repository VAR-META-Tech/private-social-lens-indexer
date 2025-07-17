import { Controller, UseGuards } from '@nestjs/common';
import { CheckpointsService } from './checkpoints.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
@ApiTags('Checkpoints')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller({
  path: 'checkpoints',
  version: '1',
})
export class CheckpointsController {
  constructor(private readonly checkpointsService: CheckpointsService) {}
}
