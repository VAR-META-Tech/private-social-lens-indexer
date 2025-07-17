import { ApiProperty } from '@nestjs/swagger';

export class CreateRequestRewardDto {
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
}
