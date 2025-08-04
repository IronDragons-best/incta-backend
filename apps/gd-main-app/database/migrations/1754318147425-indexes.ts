import { MigrationInterface, QueryRunner } from 'typeorm';

export class Indexes1754318147425 implements MigrationInterface {
  name = 'Indexes1754318147425';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "IDX_d8fa5d69d662061afa0d2c29ad" ON "post_files" ("file_name") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_a92645e87cb0c67c1f355db488" ON "post_files" ("post_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_5e9bee993b4ce35c3606cda194" ON "devices" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3596bf371dfacb695690a305a8" ON "devices" ("updated_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1af336787b7f160eda09d482c6" ON "devices" ("user_id", "created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_c9ea9fb61d2df61a0e86cab167" ON "post_entity" ("title") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cc2b59f2109c123506cd2718c1" ON "post_entity" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_11bb8e17170a6a8a8133c35d53" ON "post_entity" ("user_id", "created_at") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."IDX_11bb8e17170a6a8a8133c35d53"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_cc2b59f2109c123506cd2718c1"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_c9ea9fb61d2df61a0e86cab167"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_1af336787b7f160eda09d482c6"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_3596bf371dfacb695690a305a8"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_5e9bee993b4ce35c3606cda194"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_a92645e87cb0c67c1f355db488"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_d8fa5d69d662061afa0d2c29ad"`);
  }
}
