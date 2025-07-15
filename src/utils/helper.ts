import { ethers } from 'ethers';
import { BlockRange } from './types/common.type';
import {
  ONE_MONTH_BLOCK_RANGE,
  MILLI_SECS_PER_SEC,
  SECS_PER_DAY,
} from './const';
import { Big } from 'big.js';

export const splitIntoMonthlyRanges = (
  fromBlock: number,
  toBlock: number,
): BlockRange[] => {
  const ranges: BlockRange[] = [];

  for (
    let current = fromBlock;
    current < toBlock;
    current += ONE_MONTH_BLOCK_RANGE
  ) {
    const rangeEnd = Math.min(current + ONE_MONTH_BLOCK_RANGE - 1, toBlock);
    ranges.push({ from: current, to: rangeEnd });
  }

  return ranges;
};

export const formatEtherNumber = (number: bigint): string => {
  return String(ethers.formatEther(number));
};

export const formatTimestamp = (number: bigint): string => {
  return String(new Big(number).mul(MILLI_SECS_PER_SEC));
};

export const convertToDays = (duration: number): string => {
  return String(new Big(duration).div(SECS_PER_DAY));
};
