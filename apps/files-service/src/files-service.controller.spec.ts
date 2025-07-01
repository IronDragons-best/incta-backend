import { Test, TestingModule } from '@nestjs/testing';
import { FilesServiceController } from './files-service.controller';
import { FilesServiceService } from './files-service.service';

describe('FilesServiceController', () => {
  let filesServiceController: FilesServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [FilesServiceController],
      providers: [FilesServiceService],
    }).compile();

    filesServiceController = app.get<FilesServiceController>(FilesServiceController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(filesServiceController.getHello()).toBe('Hello World!');
    });
  });
});
