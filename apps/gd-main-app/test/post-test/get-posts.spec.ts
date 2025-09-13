import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { QueryBus, CqrsModule } from '@nestjs/cqrs';
import request from 'supertest';

import { AppNotification, NotificationInterceptor, NotificationService } from '@common';
import { AsyncLocalStorageService, CustomLogger } from '@monitoring';

import { PostsController } from '../../src/modules/posts/interface/posts.controller';
import { PostsQueryRepository } from '../../src/modules/posts/infrastructure/posts.query.repository';
import { PostsService } from '../../src/modules/posts/application/post.service';
import { GetPostsQuery } from '../../src/modules/posts/application/use-case/get-posts.query';
import { QueryPostsInputDto } from '../../src/modules/posts/interface/dto/input/query.posts.input.dto';

import { MockPostsQueryRepository } from '../mocks/post.flow.mocks';

describe('Get Posts Integration Test', () => {
  let app: INestApplication;
  let postsQueryRepository: MockPostsQueryRepository;
  let queryBus: { execute: jest.Mock };
  let notificationService: NotificationService;

  beforeEach(async () => {
    const queryBusMock = {
      execute: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [CqrsModule],
      controllers: [PostsController],
      providers: [
        PostsService,
        {
          provide: NotificationService,
          useValue: {
            create: jest.fn().mockReturnValue(new AppNotification()),
            success: jest.fn(),
            error: jest.fn(),
            notFound: jest.fn(),
            unauthorized: jest.fn(),
            forbidden: jest.fn(),
            badRequest: jest.fn(),
          },
        },
        NotificationInterceptor,
        {
          provide: CustomLogger,
          useValue: { setContext: jest.fn(), warn: jest.fn(), error: jest.fn(), log: jest.fn() },
        },
        {
          provide: PostsQueryRepository,
          useClass: MockPostsQueryRepository,
        },
        {
          provide: AsyncLocalStorageService,
          useValue: { get: jest.fn(), set: jest.fn() },
        },
        {
          provide: QueryBus,
          useValue: queryBusMock,
        },
      ],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.useGlobalInterceptors(new NotificationInterceptor());
    await app.init();

    postsQueryRepository = module.get<MockPostsQueryRepository>(PostsQueryRepository);
    queryBus = queryBusMock;
    notificationService = module.get<NotificationService>(NotificationService);
  });

  afterEach(async () => {
    await app.close();
    jest.clearAllMocks();
  });

  describe('GET /posts', () => {
    it('200 - should successfully get posts with default pagination', async () => {
      const mockPosts = {
        items: [
          {
            id: 1,
            description: 'Test description 1',
            user: { userId: 1, username: 'user1' },
            previewImages: ['https://example.com/image1.jpg'],
            createdAt: new Date(),
          },
          {
            id: 2,
            description: 'Test description 2',
            user: { userId: 2, username: 'user2' },
            previewImages: [],
            createdAt: new Date(),
          },
        ],
        totalCount: 2,
        pagesCount: 1,
        page: 1,
        pageSize: 10,
      };

      queryBus.execute.mockResolvedValue(AppNotification.success(mockPosts));

      const response = await request(app.getHttpServer())
        .get('/posts')
        .expect(200);

      expect(queryBus.execute).toHaveBeenCalledWith(
        new GetPostsQuery(expect.objectContaining({
          pageNumber: '1',
          pageSize: '10',
          sortBy: 'createdAt',
          sortDirection: 'DESC'
        }))
      );

      expect(response.body).toEqual(expect.objectContaining({
        items: expect.arrayContaining([
          expect.objectContaining({
            id: 1,
            createdAt: expect.any(String),
          }),
        ]),
        totalCount: 2,
        pagesCount: 1,
        page: 1,
        pageSize: 10,
      }));

    });

    it('200 - should successfully get posts with pagination parameters', async () => {
      const mockPosts = {
        items: [
          {
            id: 3,
            description: 'Test description 3',
            user: { userId: 1, username: 'user1' },
            previewImages: [],
            createdAt: new Date(),
          },
        ],
        totalCount: 10,
        pagesCount: 2,
        page: 2,
        pageSize: 5,
      };

      queryBus.execute.mockResolvedValue(AppNotification.success(mockPosts));

      const queryParams = {
        pageNumber: '2',
        pageSize: '5',
        sortBy: 'createdAt',
        sortDirection: 'DESC',
      };

      const response = await request(app.getHttpServer())
        .get('/posts')
        .query(queryParams)
        .expect(200);

      expect(queryBus.execute).toHaveBeenCalledWith(
        new GetPostsQuery(expect.objectContaining({
          pageNumber: '2',
          pageSize: '5',
          sortBy: 'createdAt',
          sortDirection: 'DESC',
        }))
      );

      expect(response.body).toEqual(expect.objectContaining({
        items: expect.arrayContaining([
          expect.objectContaining({
            id: 3,
            createdAt: expect.any(String),
          }),
        ]),
        totalCount: 10,
        pagesCount: 2,
        page: 2,
        pageSize: 5,
      }));
    });

    it('200 - should successfully get posts filtered by userId', async () => {
      const userId = 1;
      const mockPosts = {
        items: [
          {
            id: 1,
            description: 'Post by user 1',
            user: { userId: 1, username: 'user1' },
            previewImages: [],
            createdAt: new Date(),
          },
        ],
        totalCount: 1,
        pagesCount: 1,
        page: 1,
        pageSize: 10,
      };

      queryBus.execute.mockResolvedValue(AppNotification.success(mockPosts));

      const response = await request(app.getHttpServer())
        .get('/posts')
        .query({ userId: userId.toString() })
        .expect(200);

      expect(queryBus.execute).toHaveBeenCalledWith(
        new GetPostsQuery(expect.objectContaining({
          userId: userId,
        }))
      );
      expect(response.body).toEqual(
        expect.objectContaining({
          items: expect.arrayContaining([
            expect.objectContaining({
              id: 1,
              createdAt: expect.any(String),
            }),
          ]),
          totalCount: 1,
          pagesCount: 1,
          page: 1,
          pageSize: 10,
        }),
      );

    });

    it('200 - should return empty list when no posts found', async () => {
      const emptyResult = {
        items: [],
        totalCount: 0,
        pagesCount: 0,
        page: 1,
        pageSize: 10,
      };

      queryBus.execute.mockResolvedValue(AppNotification.success(emptyResult));

      const response = await request(app.getHttpServer())
        .get('/posts')
        .expect(200);

      expect(response.body).toEqual(emptyResult);
    });

    it('400 - should return bad request for invalid query parameters', async () => {
      const invalidParams = {
        pageNumber: 'invalid',
        pageSize: 'invalid',
        sortDirection: 'INVALID',
      };

      await request(app.getHttpServer())
        .get('/posts')
        .query(invalidParams)
        .expect(400);

      expect(queryBus.execute).not.toHaveBeenCalled();
    });
  });
});