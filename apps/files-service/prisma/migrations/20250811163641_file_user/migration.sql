-- AlterTable
ALTER TABLE "public"."file_request" ADD COLUMN     "fileUserId" INTEGER,
ALTER COLUMN "fileId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "public"."fileUser" (
    "id" SERIAL NOT NULL,
    "filename" TEXT NOT NULL,
    "s3Key" TEXT NOT NULL,
    "s3Bucket" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "type" "public"."FileType" NOT NULL DEFAULT 'PUBLIC',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,
    "uploadedBy" INTEGER NOT NULL,

    CONSTRAINT "fileUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "fileUser_s3Key_key" ON "public"."fileUser"("s3Key");

-- CreateIndex
CREATE UNIQUE INDEX "fileUser_userId_key" ON "public"."fileUser"("userId");

-- CreateIndex
CREATE INDEX "fileUser_uploadedBy_idx" ON "public"."fileUser"("uploadedBy");

-- AddForeignKey
ALTER TABLE "public"."file_request" ADD CONSTRAINT "file_request_fileUserId_fkey" FOREIGN KEY ("fileUserId") REFERENCES "public"."fileUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
