import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UnstakingEventDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  id: string;
}
