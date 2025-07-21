import { ethers } from 'ethers';
import { MILLI_SECS_PER_SEC, SECS_PER_DAY } from './const';
import { Big } from 'big.js';

export const formatEtherNumber = (number: bigint): string => {
  return String(ethers.formatEther(number));
};

export const formatTimestamp = (number: bigint): string => {
  return String(new Big(number).mul(MILLI_SECS_PER_SEC));
};

export const convertToDays = (duration: number): string => {
  return String(new Big(duration).div(SECS_PER_DAY));
};

export const getToDate = (date: string) => {
  const originDate = new Date(date);
  const toDate = new Date(
    originDate.getFullYear(),
    originDate.getMonth(),
    originDate.getDate(),
    23,
    59,
    59,
  );
  return toDate.getTime();
};

export const getFromDate = (date: string) => {
  const originDate = new Date(date);
  const fromDate = new Date(
    originDate.getFullYear(),
    originDate.getMonth(),
    originDate.getDate(),
    0,
    0,
    0,
  );
  return fromDate.getTime();
};
