import { ApiProperty } from '@nestjs/swagger';

export class CreateUnstakingEventDto {
  @ApiProperty({ required: true })
  tx_hash: string;

  @ApiProperty({ required: true })
  wallet_address: string;

  @ApiProperty({ required: true })
  amount: string;

  @ApiProperty({ required: true })
  block_number: string;

  @ApiProperty({ required: true })
  unstake_time: string;
}
