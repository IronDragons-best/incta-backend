import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Delete,
  Get,
  Param,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesServiceService } from '../application/files-service.service';
import { CommandBus } from '@nestjs/cqrs';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  MAX_FILES_COUNT,
  ProcessedFileData,
  SINGLE_FILE_LIMIT,
  ValidatedFilesData,
} from '@common/constants/files.constants';
import { FileValidationPipe } from '../../core/pipes/file.validation.pipe';
import { UploadFilesCommand } from '../application/use-cases/upload-files-use.case';
import { AppNotification } from '@common';
import { UploadFilesSwagger } from '../../core/decorators/swagger-settings/upload.files.swagger.decorator';
import { UploadFileInputDto } from './dto/upload.files.input.dto';
import { DeletePostFilesSwagger } from '../../core/decorators/swagger-settings/delete.post.files.swagger.decorator';
import { DeletePostFilesCommand } from '../application/use-cases/delete-post-files.use.case';

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

  @Delete('delete-post-files/:postId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @DeletePostFilesSwagger()
  async deletePostFiles(@Param('postId') postId: string) {
    return await this.commandBus.execute(new DeletePostFilesCommand(+postId));
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
  @UploadFilesSwagger()
  async uploadFiles(
    @UploadedFiles(FileValidationPipe) validatedData: ValidatedFilesData,
    @Body() body: UploadFileInputDto,
  ) {
    const { files, totalSize } = validatedData;
    const processedFiles = files.map((file: Express.Multer.File) => {
      const processedFile: ProcessedFileData = {
        originalName: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
      };

      processedFile.buffer = file.buffer;

      return processedFile;
    });
    const command: UploadFilesCommand = new UploadFilesCommand(
      processedFiles,
      totalSize,
      +body.userId,
      +body.postId,
    );
    const result: AppNotification = await this.commandBus.execute(command);
    return result;
  }
}
