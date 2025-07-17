import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateStakingEvent1752574484130 implements MigrationInterface {
  name = 'CreateStakingEvent1752574484130';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "staking_events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "txHash" character varying NOT NULL, "walletAddress" character varying NOT NULL, "amount" numeric NOT NULL, "duration" numeric NOT NULL, "hasWithdrawal" boolean NOT NULL, "withdrawalTime" numeric, "startTime" numeric NOT NULL, "blockNumber" numeric NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_3bbbf4cf97430c2695c4b6095a5" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "staking_events"`);
  }
}
