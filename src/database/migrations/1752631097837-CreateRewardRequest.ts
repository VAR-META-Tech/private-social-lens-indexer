import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRewardRequest1752631097837 implements MigrationInterface {
  name = 'CreateRewardRequest1752631097837';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "request_reward" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "blockNumber" numeric NOT NULL, "contributorAddress" character varying NOT NULL, "rewardAmount" numeric NOT NULL, "fileId" numeric NOT NULL, "proofIndex" numeric NOT NULL, "txHash" character varying NOT NULL, "blockTimestamp" numeric NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_022cfb1878020898b239cbcdbd0" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "request_reward"`);
  }
}
