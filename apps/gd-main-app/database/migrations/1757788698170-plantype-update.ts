import { MigrationInterface, QueryRunner } from 'typeorm';

export class PlantypeUpdate1757788698170 implements MigrationInterface {
  name = 'PlantypeUpdate1757788698170';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."user_subscription_entity_status_enum" RENAME TO "user_subscription_entity_status_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."user_subscription_entity_status_enum" AS ENUM('pending', 'active', 'expired', 'cancelled', 'past_due', 'failed')`,
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
      `CREATE TYPE "public"."user_subscription_entity_status_enum_old" AS ENUM('processing', 'succeeded', 'failed', 'refunded', 'cancelled')`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_subscription_entity" ALTER COLUMN "status" TYPE "public"."user_subscription_entity_status_enum_old" USING "status"::"text"::"public"."user_subscription_entity_status_enum_old"`,
    );
    await queryRunner.query(`DROP TYPE "public"."user_subscription_entity_status_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."user_subscription_entity_status_enum_old" RENAME TO "user_subscription_entity_status_enum"`,
    );
  }
}
