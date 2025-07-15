import { ApiProperty } from '@nestjs/swagger';

export class CreatestakingEventDto {
  @ApiProperty({ required: true })
  tx_hash: string;

  @ApiProperty({ required: true })
  wallet_address: string;

  @ApiProperty({ required: true })
  amount: string;

  @ApiProperty({ required: true })
  duration: string;

  @ApiProperty({ required: true })
  start_time: string;

  @ApiProperty({ required: true })
  block_number: string;

  @ApiProperty({ required: true })
  has_withdrawal: boolean;

  @ApiProperty({ required: false })
  withdrawal_time: string | null;
}
