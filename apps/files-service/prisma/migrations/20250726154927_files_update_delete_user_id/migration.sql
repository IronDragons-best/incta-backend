/*
  Warnings:

  - You are about to drop the column `userId` on the `file` table. All the data in the column will be lost.
  - Changed the type of `uploadedBy` on the `file` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropIndex
DROP INDEX "file_userId_idx";

-- AlterTable
ALTER TABLE "file" DROP COLUMN "userId",
DROP COLUMN "uploadedBy",
ADD COLUMN     "uploadedBy" BIGINT NOT NULL;

-- CreateIndex
CREATE INDEX "file_uploadedBy_idx" ON "file"("uploadedBy");
