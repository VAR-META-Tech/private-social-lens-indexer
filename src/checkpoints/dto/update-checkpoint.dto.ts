// Don't forget to use the class-validator decorators in the DTO properties.
// import { Allow } from 'class-validator';

import { PartialType } from '@nestjs/swagger';
import { CreateCheckpointDto } from './create-checkpoint.dto';

export class UpdateCheckpointDto extends PartialType(CreateCheckpointDto) {}
