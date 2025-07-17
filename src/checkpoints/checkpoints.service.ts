import {
  // common
  Injectable,
} from '@nestjs/common';
import { ethers } from 'ethers';
import { CreateCheckpointDto } from './dto/create-checkpoint.dto';
import { UpdateCheckpointDto } from './dto/update-checkpoint.dto';
import { CheckpointRepository } from './infrastructure/persistence/checkpoint.repository';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { Checkpoint } from './domain/checkpoint';
import { QueryType } from '../utils/common.type';
import { Web3Service } from '../web3/web3.service';
import { formatTimestamp } from '../utils/helper';
@Injectable()
export class CheckpointsService {
  private provider: ethers.Provider;

  constructor(
    // Dependencies here
    private readonly checkpointRepository: CheckpointRepository,
    private readonly web3Service: Web3Service,
  ) {
    this.provider = this.web3Service.getProvider();
  }

  async create(createCheckpointDto: CreateCheckpointDto) {
    return this.checkpointRepository.create(createCheckpointDto);
  }

  async findLatestCheckpoint(queryType: QueryType) {
    return this.checkpointRepository.findLatestCheckpoint(queryType);
  }

  async saveLatestCheckpoint(toBlock: number, queryType: QueryType) {
    try {
      const block = await this.provider.getBlock(toBlock);
      const unstakeTime = block?.timestamp || 0;

      await this.create({
        blockNumber: String(toBlock),
        blockTimestamp: formatTimestamp(BigInt(unstakeTime)),
        queryType: queryType,
      });
    } catch (error) {
      throw error;
    }
  }

  findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }) {
    return this.checkpointRepository.findAllWithPagination({
      paginationOptions: {
        page: paginationOptions.page,
        limit: paginationOptions.limit,
      },
    });
  }

  findById(id: Checkpoint['id']) {
    return this.checkpointRepository.findById(id);
  }

  findByIds(ids: Checkpoint['id'][]) {
    return this.checkpointRepository.findByIds(ids);
  }

  async update(
    id: Checkpoint['id'],
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    updateCheckpointDto: UpdateCheckpointDto,
  ) {
    // Do not remove comment below.
    // <updating-property />

    return this.checkpointRepository.update(id, {
      // Do not remove comment below.
      // <updating-property-payload />
    });
  }

  remove(id: Checkpoint['id']) {
    return this.checkpointRepository.remove(id);
  }
}
