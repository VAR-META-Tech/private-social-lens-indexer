// Don't forget to use the class-validator decorators in the DTO properties.
// import { Allow } from 'class-validator';
import { PartialType } from '@nestjs/swagger';
import { CreatestakingEventDto } from './create-staking-event.dto';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateStakingEventDto extends PartialType(CreatestakingEventDto) {
  @IsBoolean()
  @IsOptional()
  has_withdrawal?: boolean;

  @IsString()
  @IsOptional()
  withdrawal_time?: string | null;
}
