import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCheckPoint1752725302064 implements MigrationInterface {
  name = 'CreateCheckPoint1752725302064';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."checkpoint_querytype_enum" AS ENUM('fetch-staking', 'fetch-unstaking', 'fetch-request-reward')`,
    );
    await queryRunner.query(
      `CREATE TABLE "checkpoint" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "blockNumber" numeric NOT NULL, "blockTimestamp" numeric NOT NULL, "queryType" "public"."checkpoint_querytype_enum" NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_fea86db187949398f8b614f730a" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "checkpoint"`);
    await queryRunner.query(`DROP TYPE "public"."checkpoint_querytype_enum"`);
  }
}
