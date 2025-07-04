import { Controller } from '@nestjs/common';
import { FilesServiceService } from './files-service.service';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class FilesServiceController {
  constructor(private readonly filesServiceService: FilesServiceService) {}

  @MessagePattern('files-check')
  check() {
    return this.filesServiceService.check();
  }
}
