import { Injectable, OnModuleInit } from '@nestjs/common';
import { ethers, EventLog } from 'ethers';
import { Web3Service } from '../../web3/web3.service';
import { StakingEventsService } from '../../staking-events/staking-events.service';
import {
  convertToDays,
  formatEtherNumber,
  formatTimestamp,
} from '../../utils/helper';

@Injectable()
export class StakingEventListenerService implements OnModuleInit {
  private provider: ethers.Provider;
  private stakingContract: ethers.Contract;

  constructor(
    private readonly web3Service: Web3Service,
    private readonly stakingEventsService: StakingEventsService,
  ) {
    this.provider = web3Service.getProvider();
    this.stakingContract = web3Service.getStakingContract();
  }

  async onModuleInit(): Promise<void> {
    const stakingFilter = await this.getStakingEventFilter();

    void this.provider.on(stakingFilter, async (event) => {
      await this.logEvent(event);
    });
  }

  async findStake(
    user: string,
    amount: bigint,
    startTime: bigint,
    duration: bigint,
  ): Promise<any> {
    const totalStakes = await this.stakingContract.getActiveStakes(user);

    const stake = totalStakes.find(
      (stake) =>
        formatEtherNumber(stake.amount) === formatEtherNumber(amount) &&
        formatTimestamp(stake.startTime) === formatTimestamp(startTime) &&
        convertToDays(Number(stake.duration)) ===
          convertToDays(Number(duration)),
    );

    return stake;
  }

  private async getStakingEventFilter() {
    const eventHash = await this.stakingContract.filters
      .TokensStaked()
      .getTopicFilter();

    const filter: ethers.EventFilter = {
      address: this.stakingContract.getAddress(),
      topics: eventHash,
    };

    return filter;
  }

  async logEvent(event: EventLog): Promise<void> {
    try {
      const parsedEvent = this.stakingContract.interface.parseLog(event);

      const stake = await this.findStake(
        parsedEvent?.args[0],
        parsedEvent?.args[1],
        parsedEvent?.args[2],
        parsedEvent?.args[3],
      );

      const stakingEvent = {
        tx_hash: event.transactionHash,
        wallet_address: parsedEvent?.args[0],
        amount: String(formatEtherNumber(parsedEvent?.args[1]) || 0),
        start_time: String(formatTimestamp(parsedEvent?.args[2]) || 0),
        duration: String(convertToDays(Number(parsedEvent?.args[3]) || 0)),
        block_number: String(event.blockNumber),
        has_withdrawal: stake.hasWithdrawn,
        withdrawal_time: formatTimestamp(stake.withdrawalTime),
      };

      await this.stakingEventsService.create(stakingEvent);
    } catch (error) {
      throw error;
    }
  }
}
