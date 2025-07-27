/*
  Warnings:

  - You are about to drop the `File` table. If the table is not empty, all the data it contains will be lost.
  - Changed the type of `requestedBy` on the `file_request` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "file_request" DROP CONSTRAINT "file_request_fileId_fkey";

-- AlterTable
ALTER TABLE "file_request" DROP COLUMN "requestedBy",
ADD COLUMN     "requestedBy" BIGINT NOT NULL;

-- DropTable
DROP TABLE "File";

-- CreateTable
CREATE TABLE "file" (
    "id" SERIAL NOT NULL,
    "filename" TEXT NOT NULL,
    "s3Key" TEXT NOT NULL,
    "s3Bucket" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" BIGINT NOT NULL,
    "type" "FileType" NOT NULL DEFAULT 'PUBLIC',
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "postId" BIGINT NOT NULL,
    "userId" BIGINT NOT NULL,

    CONSTRAINT "file_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "file_s3Key_key" ON "file"("s3Key");

-- CreateIndex
CREATE INDEX "file_userId_idx" ON "file"("userId");

-- CreateIndex
CREATE INDEX "file_postId_idx" ON "file"("postId");

-- AddForeignKey
ALTER TABLE "file_request" ADD CONSTRAINT "file_request_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "file"("id") ON DELETE CASCADE ON UPDATE CASCADE;
