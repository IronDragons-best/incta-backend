import { Injectable } from '@nestjs/common';
import { FilesConfigService, POST_FILES_BUCKET_NAME, ProcessedFileData } from '@common';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { CustomLogger } from '@monitoring';

@Injectable()
export class S3StorageAdapter {
  private s3Client: S3Client;
  private bucketName: string = POST_FILES_BUCKET_NAME;
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
    postId: number,
  ): Promise<{ filename: string; url: string; key: string }> {
    const key = `uploads/users/${userId}/posts/${postId}/${Date.now()}-${encodeURIComponent(file.originalName)}-${postId}`;
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
      filename: `${Date.now()}-${encodeURIComponent(file.originalName)}-${postId}`,
      url: `http://${this.configService.s3Server}/${this.bucketName}/${key}`,
      key,
    };
  }

  async uploadWithStream(
    file: ProcessedFileData,
    userId: number,
    postId: number,
  ): Promise<{ filename: string; url: string; key: string }> {
    const key = `uploads/users/${userId}/posts/${postId}/${Date.now()}-${encodeURIComponent(file.originalName)}-${postId}`;

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
      filename: `${Date.now()}-${encodeURIComponent(file.originalName)}-${postId}`,
      url: result.Location!,
      key,
    };
  }
}
