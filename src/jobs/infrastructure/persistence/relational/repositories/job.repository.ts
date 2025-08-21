import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { JobEntity } from '../entities/job.entity';
import { Job, JobStatus } from '../../../../domain/job';
import { JobMapper } from '../mappers/job.mapper';

@Injectable()
export class JobRepository {
  constructor(
    @InjectRepository(JobEntity)
    private readonly repository: Repository<JobEntity>,
  ) {}

  async create(job: Job): Promise<Job> {
    const entity = JobMapper.toEntity(job);
    const savedEntity = await this.repository.save(entity);
    return JobMapper.toDomain(savedEntity);
  }

  async findPendingJobs(limit: number = 100): Promise<Job[]> {
    const entities = await this.repository.find({
      where: { status: JobStatus.PENDING },
      order: { toBlock: 'DESC' },
      take: limit,
    });
    return entities.map(JobMapper.toDomain);
  }

  async findFailedJobs(limit: number = 100): Promise<Job[]> {
    const entities = await this.repository.find({
      where: { status: JobStatus.FAILED },
      order: { lastAttemptAt: 'ASC' },
      take: limit,
    });
    return entities.map(JobMapper.toDomain);
  }

  async update(job: Job): Promise<Job> {
    const entity = JobMapper.toEntity(job);
    const updatedEntity = await this.repository.save(entity);
    return JobMapper.toDomain(updatedEntity);
  }

  async findById(id: string): Promise<Job | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? JobMapper.toDomain(entity) : null;
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async countByStatus(status: JobStatus): Promise<number> {
    return this.repository.count({ where: { status } });
  }

  async findOldFailedJobs(olderThanMinutes: number): Promise<Job[]> {
    const cutoffTime = new Date(Date.now() - olderThanMinutes * 60 * 1000);
    const entities = await this.repository
      .createQueryBuilder('job')
      .where('job.status = :status', { status: JobStatus.FAILED })
      .andWhere('job.lastAttemptAt < :cutoffTime', { cutoffTime })
      .orderBy('job.lastAttemptAt', 'ASC')
      .getMany();
    return entities.map(JobMapper.toDomain);
  }

  async removeCompletedJobs(olderThanDays: number): Promise<void> {
    const cutoffTime = new Date(
      Date.now() - olderThanDays * 24 * 60 * 60 * 1000,
    );
    await this.repository.delete({
      status: JobStatus.COMPLETED,
      completedAt: LessThan(cutoffTime),
    });
  }
}
