import { MigrationInterface, QueryRunner } from "typeorm";

export class PaymentTypeUpdate1760278478696 implements MigrationInterface {
    name = 'PaymentTypeUpdate1760278478696'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."payment_info_status_enum" RENAME TO "payment_info_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."payment_info_status_enum" AS ENUM('processing', 'succeeded', 'failed', 'refunded', 'cancelled', 'scheduled')`);
        await queryRunner.query(`ALTER TABLE "payment_info" ALTER COLUMN "status" TYPE "public"."payment_info_status_enum" USING "status"::"text"::"public"."payment_info_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."payment_info_status_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."user_subscription_entity_status_enum" RENAME TO "user_subscription_entity_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."user_subscription_entity_status_enum" AS ENUM('ACTIVE', 'CANCELED', 'PAST_DUE', 'INCOMPLETE', 'INCOMPLETE_EXPIRED', 'TRIALING', 'UNPAID', 'SCHEDULED')`);
        await queryRunner.query(`ALTER TABLE "user_subscription_entity" ALTER COLUMN "status" TYPE "public"."user_subscription_entity_status_enum" USING "status"::"text"::"public"."user_subscription_entity_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."user_subscription_entity_status_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."user_subscription_entity_status_enum_old" AS ENUM('ACTIVE', 'CANCELED', 'PAST_DUE', 'INCOMPLETE', 'INCOMPLETE_EXPIRED', 'TRIALING', 'UNPAID')`);
        await queryRunner.query(`ALTER TABLE "user_subscription_entity" ALTER COLUMN "status" TYPE "public"."user_subscription_entity_status_enum_old" USING "status"::"text"::"public"."user_subscription_entity_status_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."user_subscription_entity_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."user_subscription_entity_status_enum_old" RENAME TO "user_subscription_entity_status_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."payment_info_status_enum_old" AS ENUM('processing', 'succeeded', 'failed', 'refunded', 'cancelled')`);
        await queryRunner.query(`ALTER TABLE "payment_info" ALTER COLUMN "status" TYPE "public"."payment_info_status_enum_old" USING "status"::"text"::"public"."payment_info_status_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."payment_info_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."payment_info_status_enum_old" RENAME TO "payment_info_status_enum"`);
    }

}
