import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCheckPointCheckPoint1753073027159
  implements MigrationInterface
{
  name = 'CreateCheckPointCheckPoint1753073027159';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "checkpoint" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "toBlockNumber" numeric NOT NULL, "fromBlockNumber" numeric NOT NULL, "blockTimestamp" numeric NOT NULL, "queryType" "public"."checkpoint_querytype_enum" NOT NULL, "isFailed" boolean NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_fea86db187949398f8b614f730a" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "checkpoint"`);
  }
}
