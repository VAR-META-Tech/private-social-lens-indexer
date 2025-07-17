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
  blockNumber: string;

  @ApiProperty({
    type: String,
  })
  blockTimestamp: string;

  @ApiProperty({
    type: String,
  })
  queryType: QueryType;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
