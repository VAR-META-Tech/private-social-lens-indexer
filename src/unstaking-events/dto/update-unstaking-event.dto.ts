import { PartialType } from '@nestjs/swagger';
import { CreateUnstakingEventDto } from './create-unstaking-event.dto';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateUnstakingEventDto extends PartialType(
  CreateUnstakingEventDto,
) {
  @IsBoolean()
  @IsOptional()
  hasWithdrawal?: boolean;

  @IsString()
  @IsOptional()
  withdrawalTime?: string;
}
