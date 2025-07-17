import { ApiProperty } from '@nestjs/swagger';

export class CreateUnstakingEventDto {
  @ApiProperty({ required: true })
  txHash: string;

  @ApiProperty({ required: true })
  walletAddress: string;

  @ApiProperty({ required: true })
  amount: string;

  @ApiProperty({ required: true })
  blockNumber: string;

  @ApiProperty({ required: true })
  unstakeTime: string;
}
