import { MigrationInterface, QueryRunner } from 'typeorm';

export class PlantypeUpdate1757783884414 implements MigrationInterface {
  name = 'PlantypeUpdate1757783884414';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."payment_info_plan_type_enum" RENAME TO "payment_info_plan_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."payment_info_plan_type_enum" AS ENUM('monthly', '3month', '6month')`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_info" ALTER COLUMN "plan_type" TYPE "public"."payment_info_plan_type_enum" USING "plan_type"::"text"::"public"."payment_info_plan_type_enum"`,
    );
    await queryRunner.query(`DROP TYPE "public"."payment_info_plan_type_enum_old"`);
    await queryRunner.query(
      `ALTER TYPE "public"."user_subscription_entity_plan_type_enum" RENAME TO "user_subscription_entity_plan_type_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."user_subscription_entity_plan_type_enum" AS ENUM('monthly', '3month', '6month')`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_subscription_entity" ALTER COLUMN "plan_type" TYPE "public"."user_subscription_entity_plan_type_enum" USING "plan_type"::"text"::"public"."user_subscription_entity_plan_type_enum"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."user_subscription_entity_plan_type_enum_old"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."user_subscription_entity_plan_type_enum_old" AS ENUM('monthly', 'yearly')`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_subscription_entity" ALTER COLUMN "plan_type" TYPE "public"."user_subscription_entity_plan_type_enum_old" USING "plan_type"::"text"::"public"."user_subscription_entity_plan_type_enum_old"`,
    );
    await queryRunner.query(
      `DROP TYPE "public"."user_subscription_entity_plan_type_enum"`,
    );
    await queryRunner.query(
      `ALTER TYPE "public"."user_subscription_entity_plan_type_enum_old" RENAME TO "user_subscription_entity_plan_type_enum"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."payment_info_plan_type_enum_old" AS ENUM('monthly', 'yearly')`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_info" ALTER COLUMN "plan_type" TYPE "public"."payment_info_plan_type_enum_old" USING "plan_type"::"text"::"public"."payment_info_plan_type_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."payment_info_plan_type_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."payment_info_plan_type_enum_old" RENAME TO "payment_info_plan_type_enum"`,
    );
  }
}
