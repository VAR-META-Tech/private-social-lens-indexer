import { ApiProperty } from '@nestjs/swagger';

export class UnstakingEvent {
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
  blockNumber: string;

  @ApiProperty()
  unstakeTime: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
