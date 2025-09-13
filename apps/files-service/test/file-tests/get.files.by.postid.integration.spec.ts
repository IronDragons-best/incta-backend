import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { FilesServiceController } from '../../src/interface/files-service.controller';
import { NotificationService, FilesConfigService } from '@common';
import { Test, TestingModule } from '@nestjs/testing';
import { FilesServiceService } from '../../src/application/files-service.service';
import { FilesByUserIdViewDto } from '../../src/interface/dto/files.by.user.id.view-dto';
import request from 'supertest';
import { GetFilesByPostIdQuery } from '../../src/application/query-handlers/get.files.by.post.id.query.handler';

describe('Get Post Files', () => {
  let app: INestApplication;
  let queryBus: jest.Mocked<QueryBus>;
  let controller: FilesServiceController;
  let notificationService: NotificationService;

  const mockQueryBus = {
    execute: jest.fn(),
  };

  const mockCommandBus = {
    execute: jest.fn(),
  };

  const mockFilesService = {
    check: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FilesServiceController],
      providers: [
        { provide: FilesServiceService, useValue: mockFilesService },
        { provide: QueryBus, useValue: mockQueryBus },
        { provide: CommandBus, useValue: mockCommandBus },
        NotificationService,
        { provide: FilesConfigService, useValue: { filesAdminLogin: 'admin', filesAdminPassword: 'password' } },
      ],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
      }),
    );
    await app.init();

    controller = module.get(FilesServiceController);
    queryBus = module.get(QueryBus);
    notificationService = module.get(NotificationService);
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
    jest.clearAllMocks();
  });

  describe('GET /files/:userId/post/:postId', () => {
    const mockUserId = 1;
    const mockPostId = 123;

    it('200 успешное получение файлов поста', async () => {
      const files = [
        {
          id: 1,
          postId: mockPostId,
          originalName: 'image1.jpg',
          key: 's3-key-1',
          uploadedUrl: 'https://some-url.com/image1.jpg',
          size: 12344532,
        },
        {
          id: 2,
          postId: mockPostId,
          originalName: 'image2.jpg',
          key: 's3-key-2',
          uploadedUrl: 'https://some-url.com/image2.jpg',
          size: 22314332,
        },
      ];

      const mockResponse = {
        files,
        totalFiles: 2,
        totalSize: 34658864,
        uploadedBy: mockUserId,
      };

      const notify = notificationService.create();
      queryBus.execute.mockResolvedValue(notify.setValue(files));

      jest.spyOn(FilesByUserIdViewDto, 'mapToView').mockReturnValue(mockResponse);

      const result = await request(app.getHttpServer())
        .get(`/files/${mockUserId}/post/${mockPostId}`)
        .expect(HttpStatus.OK);

      expect(queryBus.execute).toHaveBeenCalledWith(
        new GetFilesByPostIdQuery(mockPostId, mockUserId),
      );

      expect(FilesByUserIdViewDto.mapToView).toHaveBeenCalledWith(files, mockUserId);

      expect(result.body).toEqual(mockResponse);
    });

    it('200 пустой массив когда у поста нет файлов', async () => {
      const files = [];
      const mockEmptyResponse = {
        files,
        totalFiles: 0,
        totalSize: 0,
        uploadedBy: mockUserId,
      };

      const notify = notificationService.create();
      queryBus.execute.mockResolvedValue(notify.setValue(files));

      jest.spyOn(FilesByUserIdViewDto, 'mapToView').mockReturnValue(mockEmptyResponse);

      const result = await request(app.getHttpServer())
        .get(`/files/${mockUserId}/post/${mockPostId}`)
        .expect(HttpStatus.OK);

      expect(queryBus.execute).toHaveBeenCalledWith(
        new GetFilesByPostIdQuery(mockPostId, mockUserId),
      );

      expect(FilesByUserIdViewDto.mapToView).toHaveBeenCalledWith(files, mockUserId);

      expect(result.body).toEqual(mockEmptyResponse);
      expect(result.body.files).toHaveLength(0);
      expect(result.body.totalFiles).toBe(0);
      expect(result.body.totalSize).toBe(0);
      expect(result.body.uploadedBy).toBe(mockUserId);
    });
  });
});
