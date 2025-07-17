import { ApiProperty } from '@nestjs/swagger';

export class RequestReward {
  @ApiProperty({
    type: String,
  })
  id: string;

  @ApiProperty()
  blockNumber: string;

  @ApiProperty()
  contributorAddress: string;

  @ApiProperty()
  rewardAmount: string;

  @ApiProperty()
  fileId: string;

  @ApiProperty()
  proofIndex: string;

  @ApiProperty()
  txHash: string;

  @ApiProperty()
  blockTimestamp: string;

  @ApiProperty({
    type: String,
  })
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
