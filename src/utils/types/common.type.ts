export interface BlockRange {
  from: number;
  to: number;
  checkpointId?: string;
}

export type IBatch = BlockRange;
