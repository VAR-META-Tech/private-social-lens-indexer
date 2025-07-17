import { ApiProperty } from '@nestjs/swagger';
import { QueryType } from '../../utils/common.type';

export class CreateCheckpointDto {
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
}
