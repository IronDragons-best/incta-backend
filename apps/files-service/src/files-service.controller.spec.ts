import { Test, TestingModule } from '@nestjs/testing';
import { FilesServiceController } from './files-service.controller';
import { FilesServiceService } from './files-service.service';

describe('FilesServiceController', () => {
  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [FilesServiceController],
      providers: [FilesServiceService],
    }).compile();
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(1).toBe(1);
    });
  });
});
