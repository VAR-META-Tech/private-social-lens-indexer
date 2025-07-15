import { Injectable, OnModuleInit } from '@nestjs/common';
import { ethers, EventLog } from 'ethers';
import { Web3Service } from '../../web3/web3.service';
import { formatEtherNumber, formatTimestamp } from '../../utils/helper';
import { UnstakingEventsService } from '../../unstaking-events/unstaking-events.service';
import STAKING_CONTRACT_ABI from '../../contract/staking-abi.json';
import { StakingEventsService } from '../../staking-events/staking-events.service';
@Injectable()
export class UnstakingEventListenerService implements OnModuleInit {
  private provider: ethers.Provider;
  private stakingContract: ethers.Contract;

  constructor(
    private readonly web3Service: Web3Service,
    private readonly unstakingEventsService: UnstakingEventsService,
    private readonly stakingEventsService: StakingEventsService,
  ) {
    this.provider = web3Service.getProvider();
    this.stakingContract = web3Service.getStakingContract();
  }

  async onModuleInit(): Promise<void> {
    const unstakingFilter = await this.getUnstakingEventFilter();

    void this.provider.on(unstakingFilter, async (event) => {
      await this.logEvent(event);
    });
  }

  private async getUnstakingEventFilter() {
    const eventHash = await this.stakingContract.filters
      .TokensUnstaked()
      .getTopicFilter();

    const filter: ethers.EventFilter = {
      address: this.stakingContract.getAddress(),
      topics: eventHash,
    };

    return filter;
  }

  async getStakeIndex(txHash: string) {
    const tx = await this.provider.getTransaction(txHash);
    const iface = new ethers.Interface(STAKING_CONTRACT_ABI.abi);

    if (!tx) return;

    const decodedInput = iface.parseTransaction({ data: tx.data });

    if (!decodedInput) return;

    const stakeIndex = decodedInput.args[0];

    return Number(stakeIndex);
  }

  async updateStakeEvent(stakeIndex: number, walletAddress: string) {
    if (!walletAddress) return;

    const stake = await this.stakingContract.getStake(
      walletAddress,
      stakeIndex,
    );

    const stakeEvent = await this.stakingEventsService.getStakeByIndex(
      stakeIndex,
      walletAddress,
    );

    if (!stakeEvent || !stake) return;

    await this.stakingEventsService.update(stakeEvent.id, {
      has_withdrawal: stake.hasWithdrawn || false,
      withdrawal_time: stake.withdrawalTime
        ? formatTimestamp(stake.withdrawalTime)
        : null,
    });
  }

  async logEvent(event: EventLog): Promise<void> {
    try {
      const parsedEvent = this.stakingContract.interface.parseLog(event);

      const block = await this.provider.getBlock(event.blockNumber);
      const unstakeTime = block?.timestamp || 0;

      const unstakingEvent = {
        tx_hash: event.transactionHash,
        wallet_address: parsedEvent?.args[0],
        amount: String(formatEtherNumber(parsedEvent?.args[1])),
        block_number: String(event.blockNumber),
        unstake_time: formatTimestamp(BigInt(unstakeTime)),
      };

      await this.unstakingEventsService.create(unstakingEvent);
      const stakeIndex = await this.getStakeIndex(event.transactionHash);

      if (stakeIndex === null || stakeIndex === undefined) return;

      await this.updateStakeEvent(stakeIndex, unstakingEvent.wallet_address);
    } catch (error) {
      throw error;
    }
  }
}
