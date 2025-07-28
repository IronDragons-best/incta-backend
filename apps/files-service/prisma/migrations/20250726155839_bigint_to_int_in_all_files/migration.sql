/*
  Warnings:

  - You are about to alter the column `size` on the `file` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `postId` on the `file` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `uploadedBy` on the `file` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `requestedBy` on the `file_request` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.

*/
-- AlterTable
ALTER TABLE "file" ALTER COLUMN "size" SET DATA TYPE INTEGER,
ALTER COLUMN "postId" SET DATA TYPE INTEGER,
ALTER COLUMN "uploadedBy" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "file_request" ALTER COLUMN "requestedBy" SET DATA TYPE INTEGER;
