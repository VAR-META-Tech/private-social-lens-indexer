import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import STAKING_CONTRACT_ABI from '../contract/staking-abi.json';
import DLP_CONTRACT_ABI from '../contract/dlp-abi.json';
import TOKEN_CONTRACT_ABI from '../contract/token-abi.json';
import { AllConfigType } from '../config/config.type';
import { IWeb3Config } from '../config/app-config.type';

@Injectable()
export class Web3Service {
  private provider: ethers.JsonRpcProvider;
  private stakingContract: ethers.Contract;
  private dlpContract: ethers.Contract;
  private tokenContract: ethers.Contract;
  private web3Config: IWeb3Config | undefined;

  constructor(private readonly configService: ConfigService<AllConfigType>) {
    this.web3Config = this.configService.get('app.web3Config', { infer: true });

    this.provider = new ethers.JsonRpcProvider(this.web3Config?.rpcUrl ?? '');

    this.stakingContract = new ethers.Contract(
      this.web3Config?.stakingContractAddress ?? '',
      STAKING_CONTRACT_ABI.abi,
      this.provider,
    );
    this.dlpContract = new ethers.Contract(
      this.web3Config?.dlpContractAddress ?? '',
      DLP_CONTRACT_ABI.abi,
      this.provider,
    );
    this.tokenContract = new ethers.Contract(
      this.web3Config?.tokenContractAddress ?? '',
      TOKEN_CONTRACT_ABI.abi,
      this.provider,
    );
  }

  getStakingContract(): ethers.Contract {
    return this.stakingContract;
  }

  getDlpContract(): ethers.Contract {
    return this.dlpContract;
  }

  getTokenContract(): ethers.Contract {
    return this.tokenContract;
  }

  getProvider(): ethers.Provider {
    return this.provider;
  }

  getCurrentBlock(): Promise<number> {
    return this.provider.getBlockNumber();
  }

  surpassMaxQueryRange(fromBlock: number, toBlock: number) {
    if (!this.web3Config) {
      throw new Error('Web3 config is not set');
    }

    const gap = toBlock - fromBlock;
    const maxQueryBlockRange = this.web3Config?.maxQueryBlockRange ?? 0;

    return gap > maxQueryBlockRange;
  }

  async fetchStaking(fromBlock: number, toBlock: number) {
    if (this.surpassMaxQueryRange(fromBlock, toBlock)) {
      throw new Error('Query range is too large');
    }

    try {
      const events = await this.getStakingContract().queryFilter(
        this.getStakingContract().filters.TokensStaked(),
        fromBlock,
        toBlock,
      );

      return events;
    } catch (error) {
      console.error('Error fetching staking events:', error);
      throw error;
    }
  }

  async fetchUnstaking(fromBlock: number, toBlock: number) {
    if (this.surpassMaxQueryRange(fromBlock, toBlock)) {
      throw new Error('Query range is too large');
    }

    try {
      const events = await this.getStakingContract().queryFilter(
        this.getStakingContract().filters.TokensUnstaked(),
        fromBlock,
        toBlock,
      );

      return events;
    } catch (error) {
      console.error('Error fetching unstaking events:', error);
      throw error;
    }
  }

  async fetchReqReward(fromBlock: number, toBlock: number) {
    if (this.surpassMaxQueryRange(fromBlock, toBlock)) {
      throw new Error('Query range is too large');
    }

    try {
      const events = await this.getDlpContract().queryFilter(
        this.getDlpContract().filters.RewardRequested(),
        fromBlock,
        toBlock,
      );

      return events;
    } catch (error) {
      console.error('Error fetching req reward events:', error);
      throw error;
    }
  }
}
