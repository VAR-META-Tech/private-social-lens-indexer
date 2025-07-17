import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUnstakingEvent1752574513169 implements MigrationInterface {
  name = 'CreateUnstakingEvent1752574513169';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "unstaking_events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "txHash" character varying NOT NULL, "walletAddress" character varying NOT NULL, "amount" numeric NOT NULL, "blockNumber" numeric NOT NULL, "unstakeTime" numeric NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_9accc685bbef2a834f0853102a1" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "unstaking_events"`);
  }
}
