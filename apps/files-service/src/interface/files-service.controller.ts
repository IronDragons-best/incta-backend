import {
  Body,
  Controller,
  Get,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesServiceService } from '../application/files-service.service';
import { CommandBus } from '@nestjs/cqrs';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  FileProcessingType,
  MAX_FILES_COUNT,
  ProcessedFileData,
  SINGLE_FILE_LIMIT,
  ValidatedFilesData,
} from '@common/constants/files.constants';
import { FileValidationPipe } from '../../core/pipes/file.validation.pipe';
import { Readable } from 'stream';
import { UploadFilesCommand } from '../application/use-cases/upload-files-use.case';
import { AppNotification } from '@common';

@Controller()
export class FilesServiceController {
  constructor(
    private readonly filesServiceService: FilesServiceService,
    private readonly commandBus: CommandBus,
  ) {}

  @Get('health')
  check() {
    return this.filesServiceService.check();
  }

  @Post('upload')
  @UseInterceptors(
    FilesInterceptor('files', MAX_FILES_COUNT, {
      limits: {
        fileSize: SINGLE_FILE_LIMIT,
        files: MAX_FILES_COUNT,
      },
    }),
  )
  async uploadFiles(
    @UploadedFiles(FileValidationPipe) validatedData: ValidatedFilesData,
    @Body() body: { userId: number; postId: number },
  ) {
    const { files, totalSize, processingType } = validatedData;
    const processedFiles = files.map((file: Express.Multer.File) => {
      const processedFile: ProcessedFileData = {
        originalName: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
      };
      if (processingType === FileProcessingType.STREAM) {
        processedFile.stream = Readable.from(file.buffer);
      } else {
        processedFile.buffer = file.buffer;
      }
      return processedFile;
    });
    const command: UploadFilesCommand = new UploadFilesCommand(
      processedFiles,
      processingType,
      totalSize,
      +body.userId,
      +body.postId,
    );
    const result: AppNotification = await this.commandBus.execute(command);
    return result.getValue();
  }
}
