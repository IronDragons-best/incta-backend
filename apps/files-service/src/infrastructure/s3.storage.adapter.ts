import { Injectable } from '@nestjs/common';
import { FilesConfigService, ProcessedFileData } from '@common';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { CustomLogger } from '@monitoring';

@Injectable()
export class S3StorageAdapter {
  private s3Client: S3Client;
  private bucketName: string = 'post-photos';
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
  ): Promise<{ url: string }> {
    const key = `uploads/users/${userId}/posts/${postId}/${Date.now()}-${encodeURIComponent(file.originalName)}`;
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
      url: `http://${this.configService.s3Server}/${this.bucketName}/${key}`,
    };
  }

  async uploadWithStream(
    file: ProcessedFileData,
    userId: number,
    postId: number,
  ): Promise<{ url: string }> {
    const key = `uploads/users/${userId}/posts/${postId}/${Date.now()}-${encodeURIComponent(file.originalName)}`;

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
      url: result.Location!,
    };
  }
}
