import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserSubscriptionAddUserUpdate1756481812851 implements MigrationInterface {
  name = 'UserSubscriptionAddUserUpdate1756481812851';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."user_subscription_entity_plan_type_enum" AS ENUM('monthly', 'yearly')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."user_subscription_entity_status_enum" AS ENUM('pending', 'active', 'canceled', 'expired', 'past_due')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."user_subscription_entity_payment_method_enum" AS ENUM('stripe', 'paypal')`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_subscription_entity" ("id" SERIAL NOT NULL, "plan_type" "public"."user_subscription_entity_plan_type_enum" NOT NULL, "status" "public"."user_subscription_entity_status_enum" NOT NULL, "start_date" TIMESTAMP, "end_date" TIMESTAMP, "stripe_subscription_id" character varying NOT NULL, "payment_method" "public"."user_subscription_entity_payment_method_enum" NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "canceled_at" TIMESTAMP, "user_id" integer NOT NULL, CONSTRAINT "PK_9a2b69c0f9de67b42f7ce19b353" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1a7048123c6f95d478b16fe9ec" ON "user_subscription_entity" ("user_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "has_active_subscription" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_subscription_entity" ADD CONSTRAINT "FK_1a7048123c6f95d478b16fe9ec3" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_subscription_entity" DROP CONSTRAINT "FK_1a7048123c6f95d478b16fe9ec3"`,
    );
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "has_active_subscription"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_1a7048123c6f95d478b16fe9ec"`);
    await queryRunner.query(`DROP TABLE "user_subscription_entity"`);
    await queryRunner.query(
      `DROP TYPE "public"."user_subscription_entity_payment_method_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."user_subscription_entity_status_enum"`);
    await queryRunner.query(
      `DROP TYPE "public"."user_subscription_entity_plan_type_enum"`,
    );
  }
}
