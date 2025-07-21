import { ApiProperty } from '@nestjs/swagger';
import { QueryType } from '../../utils/common.type';

export class Checkpoint {
  @ApiProperty({
    type: String,
  })
  id: string;

  @ApiProperty({
    type: String,
  })
  toBlockNumber: string;

  @ApiProperty({
    type: String,
  })
  fromBlockNumber: string;

  @ApiProperty({
    type: String,
  })
  blockTimestamp: string;

  @ApiProperty({
    type: String,
  })
  queryType: QueryType;

  @ApiProperty({
    type: Boolean,
  })
  isFailed: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
