import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdatePostEntity1755688792075 implements MigrationInterface {
  name = 'UpdatePostEntity1755688792075'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "post_entity" RENAME COLUMN "short_description" TO "description"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_c9ea9fb61d2df61a0e86cab167"`);

    await queryRunner.query(`ALTER TABLE "post_entity" DROP COLUMN "title"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "post_entity" ADD "title" character varying NOT NULL`);

    await queryRunner.query(`ALTER TABLE "post_entity" RENAME COLUMN "description" TO "short_description"`);

    await queryRunner.query(`CREATE INDEX "IDX_c9ea9fb61d2df61a0e86cab167" ON "post_entity" ("title")`);
  }
}
