import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateStakeWithdrawals1752476501583 implements MigrationInterface {
  name = 'CreateStakeWithdrawals1752476501583';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "stake_withdrawals" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "stake_id" uuid NOT NULL, "unstake_id" uuid NOT NULL, "withdrawal_time" numeric NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_15bb77c62770a906a89b298ff94" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "stake_withdrawals"`);
  }
}
