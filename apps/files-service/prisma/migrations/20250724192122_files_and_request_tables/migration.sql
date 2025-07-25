-- CreateEnum
CREATE TYPE "FileType" AS ENUM ('PUBLIC', 'PAID');

-- CreateEnum
CREATE TYPE "FileRequestStatus" AS ENUM ('APPROVED', 'DENIED');

-- CreateTable
CREATE TABLE "File" (
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

    CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file_request" (
    "id" SERIAL NOT NULL,
    "fileId" INTEGER NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "status" "FileRequestStatus" NOT NULL DEFAULT 'APPROVED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "file_request_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "File_s3Key_key" ON "File"("s3Key");

-- AddForeignKey
ALTER TABLE "file_request" ADD CONSTRAINT "file_request_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;
