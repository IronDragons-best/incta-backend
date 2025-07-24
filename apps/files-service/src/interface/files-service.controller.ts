import { Controller, Get, Post } from '@nestjs/common';
import { FilesServiceService } from '../application/files-service.service';
import { CommandBus } from '@nestjs/cqrs';
import { UploadFileCommand } from '../application/use-cases/upload.file.use-case';

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
  uploadFile() {
    const result = this.commandBus.execute(new UploadFileCommand());
  }
}
