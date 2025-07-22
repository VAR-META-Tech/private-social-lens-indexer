import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCheckpoint1753104194628 implements MigrationInterface {
  name = 'CreateCheckpoint1753104194628';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."checkpoint_querytype_enum" AS ENUM('fetch-staking', 'fetch-unstaking', 'fetch-request-reward', 'refresh-failed-staking', 'refresh-failed-unstaking', 'refresh-failed-request-reward')`,
    );
    await queryRunner.query(
      `CREATE TABLE "checkpoint" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "toBlockNumber" numeric NOT NULL, "fromBlockNumber" numeric NOT NULL, "blockTimestamp" numeric NOT NULL, "queryType" "public"."checkpoint_querytype_enum" NOT NULL, "isFailed" boolean NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_fea86db187949398f8b614f730a" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "checkpoint"`);
    await queryRunner.query(`DROP TYPE "public"."checkpoint_querytype_enum"`);
  }
}
