import { MigrationInterface, QueryRunner } from 'typeorm';

export class ProfileCityCountryAdded1754584501949 implements MigrationInterface {
  name = 'ProfileCityCountryAdded1754584501949';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "cities" ("id" SERIAL NOT NULL, "name" character varying(100) NOT NULL, "country_id" integer NOT NULL, CONSTRAINT "PK_4762ffb6e5d198cfec5606bc11e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "countries" ("id" SERIAL NOT NULL, "name" character varying(100) NOT NULL, "code" character(2) NOT NULL, CONSTRAINT "UQ_fa1376321185575cf2226b1491d" UNIQUE ("name"), CONSTRAINT "UQ_b47cbb5311bad9c9ae17b8c1eda" UNIQUE ("code"), CONSTRAINT "PK_b2d7006793e8697ab3ae2deff18" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "profile_entity" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "version" integer NOT NULL DEFAULT '1', "first_name" character varying, "last_name" character varying NOT NULL, "date_of_birth" date, "country_id" integer, "city_id" integer, "about_me" character varying(200), "user_id" integer NOT NULL, CONSTRAINT "REL_3bad362a1a9f209e9704fe56e0" UNIQUE ("user_id"), CONSTRAINT "PK_330d3560db0dac16f06a04609bb" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3bad362a1a9f209e9704fe56e0" ON "profile_entity" ("user_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "cities" ADD CONSTRAINT "FK_4aa0d9a52c36ff93415934e2d2b" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "profile_entity" ADD CONSTRAINT "FK_c3cb1458440ab6eca58c950262c" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "profile_entity" ADD CONSTRAINT "FK_8d9ebe3cd0668b61af465034e78" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "profile_entity" ADD CONSTRAINT "FK_3bad362a1a9f209e9704fe56e0a" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "profile_entity" DROP CONSTRAINT "FK_3bad362a1a9f209e9704fe56e0a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "profile_entity" DROP CONSTRAINT "FK_8d9ebe3cd0668b61af465034e78"`,
    );
    await queryRunner.query(
      `ALTER TABLE "profile_entity" DROP CONSTRAINT "FK_c3cb1458440ab6eca58c950262c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cities" DROP CONSTRAINT "FK_4aa0d9a52c36ff93415934e2d2b"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_3bad362a1a9f209e9704fe56e0"`);
    await queryRunner.query(`DROP TABLE "profile_entity"`);
    await queryRunner.query(`DROP TABLE "countries"`);
    await queryRunner.query(`DROP TABLE "cities"`);
  }
}
