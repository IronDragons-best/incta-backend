import { MigrationInterface, QueryRunner } from 'typeorm';

export class PostsEntityUpdate1753789816226 implements MigrationInterface {
  name = 'PostsEntityUpdate1753789816226';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "post_files" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "version" integer NOT NULL DEFAULT '1', "file_name" character varying NOT NULL, "file_url" character varying NOT NULL, "post_id" integer, CONSTRAINT "PK_3a75ee290763a3bfa3597f05f3e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "post_entity" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "version" integer NOT NULL DEFAULT '1', "title" character varying NOT NULL, "short_description" character varying NOT NULL, "user_id" integer NOT NULL, CONSTRAINT "PK_58a149c4e88bf49036bc4c8c79f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "post_files" ADD CONSTRAINT "FK_a92645e87cb0c67c1f355db488f" FOREIGN KEY ("post_id") REFERENCES "post_entity"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "post_entity" ADD CONSTRAINT "FK_cc2b59f2109c123506cd2718c18" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "post_entity" DROP CONSTRAINT "FK_cc2b59f2109c123506cd2718c18"`,
    );
    await queryRunner.query(
      `ALTER TABLE "post_files" DROP CONSTRAINT "FK_a92645e87cb0c67c1f355db488f"`,
    );
    await queryRunner.query(`DROP TABLE "post_entity"`);
    await queryRunner.query(`DROP TABLE "post_files"`);
  }
}
