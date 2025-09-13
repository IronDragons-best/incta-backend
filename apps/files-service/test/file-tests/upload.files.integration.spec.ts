import { FilesServiceController } from '../../src/interface/files-service.controller';
import { Test, TestingModule } from '@nestjs/testing';
import { FilesServiceService } from '../../src/application/files-service.service';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { FileValidationPipe } from '@common/pipes/file.validation.pipe';
import { AppNotification } from '@common';
import { UploadPostFilesCommand } from '../../src/application/use-cases/upload-post-files-use.case';

describe('FilesServiceController', () => {
  let controller: FilesServiceController;
  let commandBus: { execute: jest.Mock };
  let filesService: { check: jest.Mock };

  beforeEach(async () => {
    commandBus = { execute: jest.fn() };
    filesService = { check: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FilesServiceController],
      providers: [
        { provide: FilesServiceService, useValue: filesService },
        { provide: CommandBus, useValue: commandBus },
        QueryBus,
        FileValidationPipe,
      ],
    }).compile();

    controller = module.get(FilesServiceController);
  });

  describe('POST /upload', () => {
    const mockValidatedData = {
      files: [
        {
          originalname: 'test.jpg',
          size: 1024,
          mimetype: 'image/jpeg',
          buffer: Buffer.from('test'),
        } as Express.Multer.File,
      ],
      totalSize: 1024,
    };

    const mockBody = { userId: 1, postId: 1 };

    const mockSuccessResponse = {
      totalFiles: 1,
      successUploaded: 1,
      totalSize: 1024,
      postId: 1,
      userId: 1,
      uploadResults: [
        {
          id: '1',
          postId: 1,
          originalName: 'test.jpg',
          key: 'files/1/1/test.jpg',
          uploadedUrl: 'https://s3.amazonaws.com/bucket/files/1/1/test.jpg',
          size: 1024,
        },
      ],
      errors: [],
    };

    it('200: успешная загрузка файлов - возвращает результат загрузки', async () => {
      const successNotification = new AppNotification<
        typeof mockSuccessResponse
      >().setValue(mockSuccessResponse);
      commandBus.execute.mockResolvedValue(successNotification);

      const result = await controller.uploadFiles(mockValidatedData, mockBody);

      expect(commandBus.execute).toHaveBeenCalledWith(expect.any(UploadPostFilesCommand));

      const executedCommand = commandBus.execute.mock.calls[0][0] as UploadPostFilesCommand;
      expect(executedCommand.files).toHaveLength(1);
      expect(executedCommand.files[0].originalName).toBe('test.jpg');
      expect(executedCommand.files[0].size).toBe(1024);
      expect(executedCommand.totalSize).toBe(1024);
      expect(executedCommand.userId).toBe(1);
      expect(executedCommand.postId).toBe(1);

      expect(result).toBeInstanceOf(AppNotification);
      expect(result.hasErrors()).toBe(false);
      expect(result.getValue()).toEqual(mockSuccessResponse);
    });

    it('400: файлы для поста уже загружены - возвращает ошибку валидации', async () => {
      const errorNotification = new AppNotification().setBadRequest(
        'Files for this post is already uploaded.',
        'postId',
      );
      commandBus.execute.mockResolvedValue(errorNotification);

      const result = await controller.uploadFiles(mockValidatedData, mockBody);

      expect(commandBus.execute).toHaveBeenCalledWith(expect.any(UploadPostFilesCommand));
      expect(result).toBeInstanceOf(AppNotification);
      expect(result.hasErrors()).toBe(true);
      expect(result.getStatusCode()).toBe(400);
      expect(result.getErrors()[0].message).toBe(
        'Files for this post is already uploaded.',
      );
      expect(result.getErrors()[0].field).toBe('postId');
    });
  });

  describe('GET /health', () => {
    it('200: проверка здоровья сервиса', () => {
      const mockHealthResponse = { status: 'ok', timestamp: Date.now() };
      filesService.check.mockReturnValue(mockHealthResponse);

      const result = controller.check();

      expect(filesService.check).toHaveBeenCalled();
      expect(result).toEqual(mockHealthResponse);
    });
  });
});
