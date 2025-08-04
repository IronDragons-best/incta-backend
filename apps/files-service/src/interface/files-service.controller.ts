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
import { CommandBus, QueryBus } from '@nestjs/cqrs';
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
import { GetFilesByUserIdQuery } from '../application/query-handlers/get.files.by.user.id.query-handler';
import { GetUsersFilesSwagger } from '../../core/decorators/swagger-settings/get.users.files.swagger.decorator';
import { GetFilesByPostIdQuery } from '../application/query-handlers/get.files.by.post.id.query.handler';
import { FileViewDto } from './dto/file.view.dto';
import { FilesByUserIdViewDto } from './dto/files.by.user.id.view-dto';
import { GetPostFilesSwagger } from '../../core/decorators/swagger-settings/get.post.files.swagger.decorator';

@Controller()
export class FilesServiceController {
  constructor(
    private readonly filesServiceService: FilesServiceService,
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get('health')
  check() {
    return this.filesServiceService.check();
  }

  @Get('files/:userId')
  @GetUsersFilesSwagger()
  @HttpCode(HttpStatus.OK)
  async getUsersFiles(@Param('userId') userId: number) {
    const result: AppNotification<FileViewDto[]> = await this.queryBus.execute(
      new GetFilesByUserIdQuery(userId),
    );
    const files = result.getValue();
    if (!files) {
      return result;
    }
    return FilesByUserIdViewDto.mapToView(files, userId);
  }

  @Get('files/:userId/post/:postId')
  @GetPostFilesSwagger()
  @HttpCode(HttpStatus.OK)
  async getPostFiles(@Param('postId') postId: number, @Param('userId') userId: number) {
    const result: AppNotification<FileViewDto[]> = await this.queryBus.execute(
      new GetFilesByPostIdQuery(postId, userId),
    );
    const files = result.getValue();
    if (!files) {
      return result;
    }
    return FilesByUserIdViewDto.mapToView(files, userId);
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
