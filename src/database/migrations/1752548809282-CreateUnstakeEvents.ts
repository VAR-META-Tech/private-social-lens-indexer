import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUnstakeEvents1752548809282 implements MigrationInterface {
  name = 'CreateUnstakeEvents1752548809282';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "unstaking_events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tx_hash" character varying NOT NULL, "wallet_address" character varying NOT NULL, "amount" numeric NOT NULL, "block_number" numeric NOT NULL, "unstake_time" numeric NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_9accc685bbef2a834f0853102a1" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "unstaking_events"`);
  }
}
