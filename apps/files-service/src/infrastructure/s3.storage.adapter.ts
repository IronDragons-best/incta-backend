import { Injectable } from '@nestjs/common';
import { FilesConfigService, ProcessedFileData } from '@common';
import { DeleteObjectsCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { CustomLogger } from '@monitoring';
import { sanitizeFileName } from '../../core/utils/sanitize.file.name';

export type UploadType = 'post' | 'avatar';

@Injectable()
export class S3StorageAdapter {
  private s3Client: S3Client;
  private bucketName: string = this.configService.postPhotosBucketName;
  constructor(
    private readonly configService: FilesConfigService,
    private readonly logger: CustomLogger,
  ) {
    this.logger.setContext('S3StorageAdapter');
    this.s3Client = new S3Client({
      region: configService.s3Region,
      endpoint: configService.s3Url,
      forcePathStyle: true,
      credentials: {
        accessKeyId: configService.s3AccessKeyId,
        secretAccessKey: configService.s3Secret,
      },
    });
  }

  async uploadWithBuffer(
    file: ProcessedFileData,
    userId: number,
    uploadType: UploadType,
    postId?: number,
  ): Promise<{ filename: string; url: string; key: string }> {
    const { key, filename } = this.generateS3Key(
      file.originalName,
      userId,
      uploadType,
      postId,
    );

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimeType,
      ContentLength: file.size,
      ACL: 'public-read',
    });

    await this.s3Client.send(command);

    return {
      filename,
      url: `http://${this.configService.s3Server}/${this.bucketName}/${key}`,
      key,
    };
  }

  async uploadWithStream(
    file: ProcessedFileData,
    userId: number,
    uploadType: UploadType,
    postId?: number,
  ): Promise<{ filename: string; url: string; key: string }> {
    const { key, filename } = this.generateS3Key(
      file.originalName,
      userId,
      uploadType,
      postId,
    );

    if (!file.stream) {
      throw new Error('Stream is required for stream upload');
    }
    const upload: Upload = new Upload({
      client: this.s3Client,
      params: {
        Bucket: this.bucketName,
        Key: key,
        Body: file.stream,
        ContentType: file.mimeType,
        ACL: 'public-read',
      },
      queueSize: 4,
      partSize: 1024 * 1024 * 5,
    });
    upload.on('httpUploadProgress', (progress) => {
      this.logger.log(
        `Upload progress: ${Math.round((progress.loaded! / progress.total!) * 100)}%`,
      );
    });
    const result = await upload.done();

    return {
      filename: filename,
      url: result.Location!,
      key,
    };
  }

  async deleteMultipleObjects(keys: string[]): Promise<void> {
    const command = new DeleteObjectsCommand({
      Bucket: this.bucketName,
      Delete: {
        Objects: keys.map((key) => ({ Key: key })),
        Quiet: false,
      },
    });

    try {
      const result = await this.s3Client.send(command);
      if (result.Errors && result.Errors.length > 0) {
        this.logger.warn(`Some files failed to delete: ${JSON.stringify(result.Errors)}`);
      }
    } catch (error) {
      this.logger.error('Bulk delete from S3 failed', error);
      throw error;
    }
  }

  private generateS3Key(
    fileName: string,
    userId: number,
    uploadType: UploadType,
    postId?: number,
  ): { key: string; filename: string } {
    const sanitized = sanitizeFileName(fileName);
    const timestamp = Date.now();

    if (uploadType === 'post') {
      if (!postId) throw new Error('postId is required for post uploads');
      const filename = `${timestamp}-${sanitized}-${postId}`;
      const key = `uploads/users/${userId}/posts/${postId}/${filename}`;
      return { key, filename };
    }

    if (uploadType === 'avatar') {
      const filename = `${timestamp}-${sanitized}`;
      const key = `uploads/users/${userId}/avatars/${filename}`;
      return { key, filename };
    }

    throw new Error('Unknown upload type');
  }
}
