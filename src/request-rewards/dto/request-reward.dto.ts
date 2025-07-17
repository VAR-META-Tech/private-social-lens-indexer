import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RequestRewardDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  id: string;
}
