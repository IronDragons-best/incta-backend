import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { FilesServiceController } from '../../src/interface/files-service.controller';
import { Test, TestingModule } from '@nestjs/testing';
import { FilesServiceService } from '../../src/application/files-service.service';
import request from 'supertest';
import { GetFilesByUserIdQuery } from '../../src/application/query-handlers/get.files.by.user.id.query-handler';

describe('Get Files by User ID', () => {
  let app: INestApplication;
  let queryBus: jest.Mocked<QueryBus>;
  let controller: FilesServiceController;

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
      const mockResponse = {
        totalFiles: 2,
        totalSize: 34658864,
        uploadedBy: mockUserId,
        files: [
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
        ],
      };

      queryBus.execute.mockResolvedValue(mockResponse);

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
      const mockEmptyResponse = {
        totalFiles: 0,
        totalSize: 0,
        uploadedBy: mockUserId,
        files: [],
      };

      queryBus.execute.mockResolvedValue(mockEmptyResponse);

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
