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
import { JobEventType } from '../jobs/domain/job';
import { Web3Service } from '../web3/web3.service';

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

  async findLatestCheckpoint() {
    return this.checkpointRepository.findLatestCheckpoint();
  }

  async findOldestCheckpoint() {
    return this.checkpointRepository.findOldestCheckpoint();
  }

  async saveLatestCheckpoint(
    toBlock: number,
    fromBlock: number,
    queryType: JobEventType,
  ) {
    try {
      await this.create({
        toBlockNumber: String(toBlock),
        fromBlockNumber: String(fromBlock),
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

  async update(id: Checkpoint['id'], updateCheckpointDto: UpdateCheckpointDto) {
    return this.checkpointRepository.update(id, updateCheckpointDto);
  }

  remove(id: Checkpoint['id']) {
    return this.checkpointRepository.remove(id);
  }
}
