import {
  Body,
  Controller,
  Get,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FilesServiceService } from '../application/files-service.service';
import { CommandBus } from '@nestjs/cqrs';
import { UploadFileCommand } from '../application/use-cases/upload.file.use-case';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';

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
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(@UploadedFile() file: Express.Multer.File, @Body() body: any) {
    console.log(body);
    console.log(file);
    const result = this.commandBus.execute(new UploadFileCommand());
    return true;
  }
}
