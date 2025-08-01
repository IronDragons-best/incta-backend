import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { MockAppConfigService, MockCommandBus } from '../mocks/common.mocks';
import {
  MockJwtAuthGuard,
  MockOwnershipGuard,
  MockPostsQueryRepository,
  MockPostsRepository,
  MockPostsService,
} from '../mocks/post.flow.mocks';
import { Test, TestingModule } from '@nestjs/testing';
import { PostsController } from '../../src/modules/posts/interface/posts.controller';
import { TokenService } from '../../src/modules/auth/application/use-cases/token.service';
import { MockTokenService } from '../mocks/auth.flow.mocks';
import { CommandBus } from '@nestjs/cqrs';
import { AppConfigService, AppNotification, NotificationInterceptor } from '@common';
import { cookieOptionsProvider } from '../../src/modules/auth/constants/cookie-options.constants';
import { CookieInterceptor } from '../../core/interceptors/refresh-cookie.interceptor';
import { PostsRepository } from '../../src/modules/posts/infrastructure/posts.repository';
import { PostsQueryRepository } from '../../src/modules/posts/infrastructure/posts.query.repository';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { PostsService } from '../../src/modules/posts/application/post.service';
import { PassportModule } from '@nestjs/passport';
import { JwtAuthGuard } from '../../core/guards/local/jwt-auth-guard';
import { OwnershipGuard } from '../../core/guards/ownership/ownership.guard';
import { UpdatePostCommand } from '../../src/modules/posts/application/use-case/update.post.use-case';

describe('Update post', () => {
  let app: INestApplication;
  let commandBus: MockCommandBus;
  let postsRepository: MockPostsRepository;
  let postsQueryRepository: MockPostsQueryRepository;
  let controller: PostsController;
  let postsService: MockPostsService;
  let ownershipGuard: MockOwnershipGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PassportModule],
      controllers: [PostsController],
      providers: [
        { provide: TokenService, useClass: MockTokenService },
        { provide: CommandBus, useClass: MockCommandBus },
        { provide: AppConfigService, useClass: MockAppConfigService },
        { provide: 'COOKIE_OPTIONS', useValue: cookieOptionsProvider },
        { provide: PostsRepository, useClass: MockPostsRepository },
        { provide: PostsQueryRepository, useClass: MockPostsQueryRepository },
        CookieInterceptor,
        { provide: PostsService, useClass: MockPostsService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(MockJwtAuthGuard)
      .overrideGuard(OwnershipGuard)
      .useClass(MockOwnershipGuard)
      .compile();

    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
      }),
    );
    app.useGlobalInterceptors(new NotificationInterceptor());
    app.use(cookieParser());
    await app.init();

    controller = module.get(PostsController);
    commandBus = module.get(CommandBus);
    postsRepository = module.get(PostsRepository);
    postsQueryRepository = module.get(PostsQueryRepository);
    ownershipGuard = module.get(OwnershipGuard);
    postsService = module.get(PostsService);
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
    jest.clearAllMocks();
  });

  describe('update', () => {
    const mockTokens = { accessToken: 'access-123', refreshToken: 'refresh-123' };
    const mockUser = { id: 1 };
    const mockPost = {
      id: 1,
      description: 'some desc',
      url: 'some url',
      userId: mockUser.id,
      title: 'Mock Post Title',
      shortDescription: 'Mock short description',
      createdAt: new Date().toISOString(),
      files: [{ fileUrl: 'http://mock-file-url.com/image1.jpg' }],
    };

    it('200 успешный', async () => {
      commandBus.execute.mockResolvedValue(
        new AppNotification<{ id: number }>().setValue({ id: mockPost.id }),
      );

      postsQueryRepository.getPostByIdWithUserId.mockResolvedValue(mockPost);

      ownershipGuard.canActivate.mockResolvedValue(true);

      const updatePayload = { description: 'updated description' };

      const result = await request(app.getHttpServer())
        .put(`/posts/${mockPost.id}`)
        .set('Authorization', `Bearer ${mockTokens.accessToken}`)
        .send(updatePayload)
        .expect(200);

      expect(commandBus.execute).toHaveBeenCalledWith(expect.any(UpdatePostCommand));
      expect(postsQueryRepository.getPostByIdWithUserId).toHaveBeenCalledWith(
        mockPost.id,
        mockUser.id,
      );

      expect(result.body).toEqual(
        expect.objectContaining({
          id: mockPost.id,
          userId: mockPost.userId,
          title: mockPost.title,
          shortDescription: mockPost.shortDescription,
          previewImages: mockPost.files.map((f) => f.fileUrl),
          createdAt: expect.any(String),
        }),
      );
    });

    it('400 при пустом description', async () => {
      const updatePayload = { description: '' };
      ownershipGuard.canActivate.mockResolvedValue(true);

      const result = await request(app.getHttpServer())
        .put(`/posts/${mockPost.id}`)
        .set('Authorization', `Bearer ${mockTokens.accessToken}`)
        .send(updatePayload)
        .expect(HttpStatus.BAD_REQUEST);

      expect(result.body).toEqual(
        expect.objectContaining({
          message: expect.any(Array),
          error: 'Bad Request',
          statusCode: HttpStatus.BAD_REQUEST,
        }),
      );
    });
  });
});
