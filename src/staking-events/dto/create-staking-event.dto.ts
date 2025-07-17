import { ApiProperty } from '@nestjs/swagger';

export class CreatestakingEventDto {
  @ApiProperty({ required: true })
  txHash: string;

  @ApiProperty({ required: true })
  walletAddress: string;

  @ApiProperty({ required: true })
  amount: string;

  @ApiProperty({ required: true })
  duration: string;

  @ApiProperty({ required: true })
  startTime: string;

  @ApiProperty({ required: true })
  blockNumber: string;

  @ApiProperty({ required: true })
  hasWithdrawal: boolean;

  @ApiProperty({ required: false })
  withdrawalTime: string | null;
}
