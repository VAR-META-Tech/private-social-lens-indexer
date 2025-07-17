// Don't forget to use the class-validator decorators in the DTO properties.
// import { Allow } from 'class-validator';

import { PartialType } from '@nestjs/swagger';
import { CreateRequestRewardDto } from './create-request-reward.dto';

export class UpdateRequestRewardDto extends PartialType(
  CreateRequestRewardDto,
) {}
