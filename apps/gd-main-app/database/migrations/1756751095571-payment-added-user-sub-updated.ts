import { MigrationInterface, QueryRunner } from 'typeorm';

export class PaymentAddedUserSubUpdated1756751095571 implements MigrationInterface {
  name = 'PaymentAddedUserSubUpdated1756751095571';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."payment_info_plan_type_enum" AS ENUM('monthly', 'yearly')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."payment_info_payment_method_enum" AS ENUM('stripe', 'paypal')`,
    );
    await queryRunner.query(
      `CREATE TABLE "payment_info" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "version" integer NOT NULL DEFAULT '1', "user_id" integer NOT NULL, "plan_type" "public"."payment_info_plan_type_enum" NOT NULL, "payment_method" "public"."payment_info_payment_method_enum" NOT NULL, "amount" numeric(10,2) NOT NULL, "billing_date" TIMESTAMP NOT NULL DEFAULT now(), "subscription_id" integer NOT NULL, CONSTRAINT "PK_b2ba4f3b3f40c6a37e54fb8b252" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0e6cebbe121ce7b8688368e030" ON "payment_info" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_8b44bedd45a00c5da45ba855ef" ON "payment_info" ("billing_date") `,
    );
    await queryRunner.query(
      `ALTER TABLE "user_subscription_entity" DROP COLUMN "stripe_subscription_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_subscription_entity" ADD "deleted_at" TIMESTAMP`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_subscription_entity" ADD "version" integer NOT NULL DEFAULT '1'`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_subscription_entity" ADD "subscription_id" character varying NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_info" ADD CONSTRAINT "FK_3adb2aca4fe68f987afa5388f91" FOREIGN KEY ("subscription_id") REFERENCES "user_subscription_entity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payment_info" DROP CONSTRAINT "FK_3adb2aca4fe68f987afa5388f91"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_subscription_entity" DROP COLUMN "subscription_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_subscription_entity" DROP COLUMN "version"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_subscription_entity" DROP COLUMN "deleted_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_subscription_entity" ADD "stripe_subscription_id" character varying NOT NULL`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_8b44bedd45a00c5da45ba855ef"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_0e6cebbe121ce7b8688368e030"`);
    await queryRunner.query(`DROP TABLE "payment_info"`);
    await queryRunner.query(`DROP TYPE "public"."payment_info_payment_method_enum"`);
    await queryRunner.query(`DROP TYPE "public"."payment_info_plan_type_enum"`);
  }
}
