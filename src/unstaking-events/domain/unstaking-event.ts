import { ApiProperty } from '@nestjs/swagger';

export class UnstakingEvent {
  @ApiProperty({
    type: String,
  })
  id: string;

  @ApiProperty()
  tx_hash: string;

  @ApiProperty()
  wallet_address: string;

  @ApiProperty()
  amount: string;

  @ApiProperty()
  block_number: string;

  @ApiProperty()
  unstake_time: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
