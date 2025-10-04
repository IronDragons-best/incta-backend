import { MigrationInterface, QueryRunner } from 'typeorm';

export class NotificationsForGraph1759596227422 implements MigrationInterface {
  name = 'NotificationsForGraph1759596227422';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "devices" DROP CONSTRAINT "FK_5e9bee993b4ce35c3606cda194c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_oauth_provider_entity" DROP CONSTRAINT "FK_4a50be4c1d722cf91b127149714"`,
    );
    await queryRunner.query(
      `ALTER TABLE "post_entity" DROP CONSTRAINT "FK_cc2b59f2109c123506cd2718c18"`,
    );
    await queryRunner.query(
      `ALTER TABLE "profile_entity" DROP CONSTRAINT "FK_3bad362a1a9f209e9704fe56e0a"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."notification_model_type_enum" AS ENUM('payment_success', 'subscription_activated', 'subscription_charge_warning', 'subscription_expiring_reminder')`,
    );
    await queryRunner.query(
      `CREATE TABLE "notification_model" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "version" integer NOT NULL DEFAULT '1', "message" character varying NOT NULL, "type" "public"."notification_model_type_enum" NOT NULL, "is_read" boolean NOT NULL DEFAULT false, "user_id" integer NOT NULL, CONSTRAINT "PK_55d25846b2d87c59aa23007d365" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1d9ccbfd609bad6c7f8de27b9a" ON "notification_model" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_fc20b8b404ef339f9ec08dfa39" ON "notification_model" ("user_id", "created_at") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."notification_settings_model_notification_type_enum" AS ENUM('payment_success', 'subscription_activated', 'subscription_charge_warning', 'subscription_expiring_reminder')`,
    );
    await queryRunner.query(
      `CREATE TABLE "notification_settings_model" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "version" integer NOT NULL DEFAULT '1', "user_id" integer NOT NULL, "notification_type" "public"."notification_settings_model_notification_type_enum" NOT NULL, "is_enabled" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_b39132b041e2ea003fa3827fdd8" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_56979dfdddaa240634229486c1" ON "notification_settings_model" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_ac2c4a49325203c7b36613f6d3" ON "notification_settings_model" ("user_id", "notification_type") `,
    );
    await queryRunner.query(
      `ALTER TABLE "devices" ADD CONSTRAINT "FK_5e9bee993b4ce35c3606cda194c" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_oauth_provider_entity" ADD CONSTRAINT "FK_4a50be4c1d722cf91b127149714" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "post_entity" ADD CONSTRAINT "FK_cc2b59f2109c123506cd2718c18" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "profile_entity" ADD CONSTRAINT "FK_3bad362a1a9f209e9704fe56e0a" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "notification_model" ADD CONSTRAINT "FK_1d9ccbfd609bad6c7f8de27b9a3" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "notification_settings_model" ADD CONSTRAINT "FK_56979dfdddaa240634229486c18" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "notification_settings_model" DROP CONSTRAINT "FK_56979dfdddaa240634229486c18"`,
    );
    await queryRunner.query(
      `ALTER TABLE "notification_model" DROP CONSTRAINT "FK_1d9ccbfd609bad6c7f8de27b9a3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "profile_entity" DROP CONSTRAINT "FK_3bad362a1a9f209e9704fe56e0a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "post_entity" DROP CONSTRAINT "FK_cc2b59f2109c123506cd2718c18"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_oauth_provider_entity" DROP CONSTRAINT "FK_4a50be4c1d722cf91b127149714"`,
    );
    await queryRunner.query(
      `ALTER TABLE "devices" DROP CONSTRAINT "FK_5e9bee993b4ce35c3606cda194c"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_ac2c4a49325203c7b36613f6d3"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_56979dfdddaa240634229486c1"`);
    await queryRunner.query(`DROP TABLE "notification_settings_model"`);
    await queryRunner.query(
      `DROP TYPE "public"."notification_settings_model_notification_type_enum"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_fc20b8b404ef339f9ec08dfa39"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_1d9ccbfd609bad6c7f8de27b9a"`);
    await queryRunner.query(`DROP TABLE "notification_model"`);
    await queryRunner.query(`DROP TYPE "public"."notification_model_type_enum"`);
    await queryRunner.query(
      `ALTER TABLE "profile_entity" ADD CONSTRAINT "FK_3bad362a1a9f209e9704fe56e0a" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "post_entity" ADD CONSTRAINT "FK_cc2b59f2109c123506cd2718c18" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_oauth_provider_entity" ADD CONSTRAINT "FK_4a50be4c1d722cf91b127149714" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "devices" ADD CONSTRAINT "FK_5e9bee993b4ce35c3606cda194c" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
