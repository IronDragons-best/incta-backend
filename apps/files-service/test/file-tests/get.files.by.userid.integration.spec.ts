import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { FilesServiceController } from '../../src/interface/files-service.controller';
import { Test, TestingModule } from '@nestjs/testing';
import { FilesServiceService } from '../../src/application/files-service.service';
import request from 'supertest';
import { GetFilesByUserIdQuery } from '../../src/application/query-handlers/get.files.by.user.id.query-handler';
import { NotificationService, FilesConfigService } from '@common';

describe('Get Files by User ID', () => {
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
        {
          provide: FilesConfigService,
          useValue: { filesAdminLogin: 'admin', filesAdminPassword: 'password' },
        },
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

  describe('GET /files/:userId', () => {
    const mockUserId = 1;

    it('200 успешное получение файлов пользователя', async () => {
      const files = [
        {
          id: 1,
          postId: 1,
          originalName: 'image1.jpg',
          key: 's3-key-1',
          uploadedUrl: 'https://some-url.com/image1.jpg',
          size: 12344532,
        },
        {
          id: 2,
          postId: 2,
          originalName: 'image2.jpg',
          key: 's3-key-2',
          uploadedUrl: 'https://some-url.com/image2.jpg',
          size: 22314332,
        },
      ];

      const mockResponse = {
        files: files,
        totalFiles: 2,
        totalSize: 34658864,
        uploadedBy: 1,
      };

      const notify = notificationService.create();
      queryBus.execute.mockResolvedValue(notify.setValue(files));

      const result = await request(app.getHttpServer())
        .get(`/files/${mockUserId}`)
        .expect(HttpStatus.OK);

      expect(queryBus.execute).toHaveBeenCalledWith(expect.any(GetFilesByUserIdQuery));
      expect(queryBus.execute).toHaveBeenCalledWith(
        new GetFilesByUserIdQuery(mockUserId),
      );

      expect(result.body).toEqual(mockResponse);
    });

    it('200 пустой массив когда у пользователя нет файлов', async () => {
      const files = [];
      const mockEmptyResponse = {
        files,
        totalFiles: 0,
        totalSize: 0,
        uploadedBy: 1,
      };

      const notify = notificationService.create();

      queryBus.execute.mockResolvedValue(notify.setValue(files));

      const result = await request(app.getHttpServer())
        .get(`/files/${mockUserId}`)
        .expect(HttpStatus.OK);

      expect(queryBus.execute).toHaveBeenCalledWith(
        new GetFilesByUserIdQuery(mockUserId),
      );

      expect(result.body).toEqual(mockEmptyResponse);
      expect(result.body.files).toHaveLength(0);
      expect(result.body.totalFiles).toBe(0);
      expect(result.body.totalSize).toBe(0);
      expect(result.body.uploadedBy).toBe(mockUserId);
    });
  });
});
