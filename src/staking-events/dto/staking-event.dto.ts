import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class StakingEventDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  id: string;
}
