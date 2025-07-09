import { MigrationInterface, QueryRunner } from "typeorm";

export class UserEntitiNameFix1752008174326 implements MigrationInterface {
    name = 'UserEntitiNameFix1752008174326'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" RENAME COLUMN "login" TO "username"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" RENAME COLUMN "username" TO "login"`);
    }

}
