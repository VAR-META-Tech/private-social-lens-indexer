import { ApiProperty } from '@nestjs/swagger';

export class StakingEvent {
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
  duration: string;

  @ApiProperty()
  start_time: string;

  @ApiProperty()
  has_withdrawal: boolean;

  @ApiProperty()
  withdrawal_time: string | null;

  @ApiProperty()
  block_number: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
