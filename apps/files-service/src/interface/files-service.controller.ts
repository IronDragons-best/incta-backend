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
  UploadedFile,
  ValidationPipe,
} from '@nestjs/common';
import { FilesServiceService } from '../application/files-service.service';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  MAX_FILES_COUNT,
  ProcessedFileData,
  SINGLE_FILE_LIMIT,
  ValidatedFilesData,
} from '@common/constants/files.constants';
import { FileValidationPipe } from '@common/pipes/file.validation.pipe';
import { UploadPostFilesCommand } from '../application/use-cases/upload-post-files-use.case';
import { AppNotification } from '@common';
import { UploadPostFileInputDto } from './dto/upload.post.files.input.dto';
import { DeletePostFilesSwagger } from '../../core/decorators/swagger-settings/delete.post.files.swagger.decorator';
import { DeletePostFilesCommand } from '../application/use-cases/delete-post-files.use.case';
import { GetFilesByUserIdQuery } from '../application/query-handlers/get.files.by.user.id.query-handler';
import { GetUsersFilesSwagger } from '../../core/decorators/swagger-settings/get.users.files.swagger.decorator';
import { GetFilesByPostIdQuery } from '../application/query-handlers/get.files.by.post.id.query.handler';
import { FilePostViewDto } from '@common/dto/filePostViewDto';
import { FilesByUserIdViewDto } from './dto/files.by.user.id.view-dto';
import { GetPostFilesSwagger } from '../../core/decorators/swagger-settings/get.post.files.swagger.decorator';
import { UploadUserFileInputDto } from './dto/upload.user.files.input.dto';
import { UploadUserFilesSwagger } from '../../core/decorators/swagger-settings/upload.user.files.swagger.decorator';
import { UploadUserAvatarCommand } from '../application/use-cases/upload-user-files-use.case';
import { UploadPostFilesSwagger } from '../../core/decorators/swagger-settings/upload.post.files.swagger.decorator';
import { DeleteAvatarFileCommand } from '../application/use-cases/delete-avatar-file.use.case';
import { DeleteUserFilesSwagger } from '../../core/decorators/swagger-settings/delete.user.files.swagger.decorator';
import { FileRequiredPipe } from '@common/pipes/file.required.pipe';

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
    const result: AppNotification<FilePostViewDto[]> = await this.queryBus.execute(
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
    const result: AppNotification<FilePostViewDto[]> = await this.queryBus.execute(
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

  @Delete('delete-avatar-files/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @DeleteUserFilesSwagger()
  async deleteAvatarFiles(@Param('userId') userId: string) {
    return await this.commandBus.execute(new DeleteAvatarFileCommand(+userId))
  }

  @Post('upload-user-files')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: SINGLE_FILE_LIMIT,
      },
    }),
  )
  @UploadUserFilesSwagger()
  async uploadUserFiles(
    @UploadedFile(new FileRequiredPipe()) file: Express.Multer.File,
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })) body: UploadUserFileInputDto,
  ) {

    const processed: ProcessedFileData = {
      originalName: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
      buffer: file.buffer,
    };

    const result = await this.commandBus.execute(
      new UploadUserAvatarCommand(processed, +body.userId),
    );

    return result;
  }

  @Post('upload-post-files')
  @UseInterceptors(
    FilesInterceptor('files', MAX_FILES_COUNT, {
      limits: {
        fileSize: SINGLE_FILE_LIMIT,
        files: MAX_FILES_COUNT,
      },
    }),
  )
  @UploadPostFilesSwagger()
  async uploadFiles(
    @UploadedFiles(FileValidationPipe) validatedData: ValidatedFilesData,
    @Body() body: UploadPostFileInputDto,
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
    const command: UploadPostFilesCommand = new UploadPostFilesCommand(
      processedFiles,
      totalSize,
      +body.userId,
      +body.postId,
    );
    const result: AppNotification = await this.commandBus.execute(command);
    return result;
  }
}
