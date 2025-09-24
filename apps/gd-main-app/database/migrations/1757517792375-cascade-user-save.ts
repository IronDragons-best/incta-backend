import { MigrationInterface, QueryRunner } from 'typeorm';

export class CascadeUserSave1757517792375 implements MigrationInterface {
  name = 'CascadeUserSave1757517792375';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."payment_info_status_enum" AS ENUM('processing', 'succeeded', 'failed', 'refunded', 'cancelled')`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_info" ADD "status" "public"."payment_info_status_enum" NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."user_subscription_entity_status_enum" RENAME TO "user_subscription_entity_status_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."user_subscription_entity_status_enum" AS ENUM('processing', 'succeeded', 'failed', 'refunded', 'cancelled')`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_subscription_entity" ALTER COLUMN "status" TYPE "public"."user_subscription_entity_status_enum" USING "status"::"text"::"public"."user_subscription_entity_status_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."user_subscription_entity_status_enum_old"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."user_subscription_entity_status_enum_old" AS ENUM('pending', 'active', 'canceled', 'expired', 'past_due')`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_subscription_entity" ALTER COLUMN "status" TYPE "public"."user_subscription_entity_status_enum_old" USING "status"::"text"::"public"."user_subscription_entity_status_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."user_subscription_entity_status_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."user_subscription_entity_status_enum_old" RENAME TO "user_subscription_entity_status_enum"`,
    );
    await queryRunner.query(`ALTER TABLE "payment_info" DROP COLUMN "status"`);
    await queryRunner.query(`DROP TYPE "public"."payment_info_status_enum"`);
  }
}
