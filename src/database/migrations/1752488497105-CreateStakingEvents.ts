import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateStakingEvents1752488497105 implements MigrationInterface {
  name = 'CreateStakingEvents1752488497105';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "staking_events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tx_hash" character varying NOT NULL, "wallet_address" character varying NOT NULL, "amount" numeric NOT NULL, "duration" numeric NOT NULL, "has_withdrawal" boolean NOT NULL, "withdrawal_time" numeric, "start_time" numeric NOT NULL, "block_number" numeric NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_3bbbf4cf97430c2695c4b6095a5" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "staking_events"`);
  }
}
