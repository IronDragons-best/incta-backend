import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { QueryBus, CqrsModule } from '@nestjs/cqrs';
import request from 'supertest';

import { AppNotification, NotificationInterceptor, NotificationService } from '@common';
import { AsyncLocalStorageService, CustomLogger } from '@monitoring';

import { PostsController } from '../../src/modules/posts/interface/posts.controller';
import { PostsQueryRepository } from '../../src/modules/posts/infrastructure/posts.query.repository';
import { PostsService } from '../../src/modules/posts/application/post.service';
import { GetPostByIdQuery } from '../../src/modules/posts/application/use-case/get.post.by.id.query';
import { PostEntity } from '../../src/modules/posts/domain/post.entity';

import { MockPostsQueryRepository } from '../mocks/post.flow.mocks';

describe('Get Post By Id Integration Test', () => {
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
          useValue: {
            setContext: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            log: jest.fn(),
          },
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

  describe('GET /posts/:id', () => {
    it('200 - should successfully get post by id', async () => {
      const postId = 1;
      const mockPost = {
        id: postId,
        description: 'Test description',
        user: {
          userId: 1,
          username: 'testuser',
        },
        previewImages: ['https://example.com/image1.jpg'],
        createdAt: new Date(),
      };

      queryBus.execute.mockResolvedValue(AppNotification.success(mockPost));

      const response = await request(app.getHttpServer())
        .get(`/posts/${postId}`)
        .expect(200);

      expect(queryBus.execute).toHaveBeenCalledWith(new GetPostByIdQuery(postId));
      expect(response.body).toEqual(
        expect.objectContaining({
          id: mockPost.id,
          description: mockPost.description,
          user: mockPost.user,
          previewImages: mockPost.previewImages,
          createdAt: expect.any(String),
        }),
      );
    });

    it('404 - should return not found when post does not exist', async () => {
      const postId = 999;
      const errorNotification = AppNotification.notFound('Post not found');

      queryBus.execute.mockResolvedValue(errorNotification);

      const response = await request(app.getHttpServer())
        .get(`/posts/${postId}`)
        .expect(404);

      expect(queryBus.execute).toHaveBeenCalledWith(new GetPostByIdQuery(postId));
      expect(response.body).toEqual(
        expect.objectContaining({
          errorsMessages: expect.arrayContaining([
            expect.objectContaining({ message: 'Post not found' }),
          ]),
        }),
      );
    });

    it('400 - should return bad request when id is invalid', async () => {
      const invalidId = 'invalid-id';

      await request(app.getHttpServer()).get(`/posts/${invalidId}`).expect(400);

      expect(queryBus.execute).not.toHaveBeenCalled();
    });
  });
});
