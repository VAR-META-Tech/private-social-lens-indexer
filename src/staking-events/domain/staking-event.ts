import { ApiProperty } from '@nestjs/swagger';

export class StakingEvent {
  @ApiProperty({
    type: String,
  })
  id: string;

  @ApiProperty()
  txHash: string;

  @ApiProperty()
  walletAddress: string;

  @ApiProperty()
  amount: string;

  @ApiProperty()
  duration: string;

  @ApiProperty()
  startTime: string;

  @ApiProperty()
  hasWithdrawal: boolean;

  @ApiProperty()
  withdrawalTime: string | null;

  @ApiProperty()
  blockNumber: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
