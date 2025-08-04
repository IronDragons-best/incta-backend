import { HttpStatus, INestApplication, ValidationPipe } from '@nestjs/common';
import { MockAppConfigService, MockCommandBus } from '../mocks/common.mocks';
import {
  MockJwtAuthGuard,
  MockOwnershipGuard,
  MockPostsQueryRepository,
  MockPostsRepository,
  MockPostsService,
} from '../mocks/post.flow.mocks';
import { PostsController } from '../../src/modules/posts/interface/posts.controller';
import { Test, TestingModule } from '@nestjs/testing';
import { PassportModule } from '@nestjs/passport';
import { TokenService } from '../../src/modules/auth/application/use-cases/token.service';
import { MockTokenService } from '../mocks/auth.flow.mocks';
import { CommandBus } from '@nestjs/cqrs';
import { AppConfigService, AppNotification, NotificationInterceptor } from '@common';
import { cookieOptionsProvider } from '../../src/modules/auth/constants/cookie-options.constants';
import { PostsRepository } from '../../src/modules/posts/infrastructure/posts.repository';
import { PostsQueryRepository } from '../../src/modules/posts/infrastructure/posts.query.repository';
import { CookieInterceptor } from '../../core/interceptors/refresh-cookie.interceptor';
import { PostsService } from '../../src/modules/posts/application/post.service';
import { JwtAuthGuard } from '../../core/guards/local/jwt-auth-guard';
import { OwnershipGuard } from '../../core/guards/ownership/ownership.guard';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { DeletePostCommand } from '../../src/modules/posts/application/use-case/delete.post.use-case';

describe('Delete post', () => {
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

  describe('delete', () => {
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

    it('204 успешное удаление', async () => {
      commandBus.execute.mockResolvedValue(new AppNotification().setNoContent());

      ownershipGuard.canActivate.mockResolvedValue(true);

      await request(app.getHttpServer())
        .delete(`/posts/${mockPost.id}`)
        .set('Authorization', `Bearer ${mockTokens.accessToken}`)
        .expect(HttpStatus.NO_CONTENT);

      expect(commandBus.execute).toHaveBeenCalledWith(expect.any(DeletePostCommand));
    });

    it('404 пост не найден', async () => {
      commandBus.execute.mockResolvedValue(
        new AppNotification().setNotFound('Post not found.'),
      );

      ownershipGuard.canActivate.mockResolvedValue(true);

      const result = await request(app.getHttpServer())
        .delete(`/posts/999`)
        .set('Authorization', `Bearer ${mockTokens.accessToken}`)
        .expect(HttpStatus.NOT_FOUND);

      expect(result.body).toEqual(
        expect.objectContaining({
          errorsMessages: [
            expect.objectContaining({
              message: 'Post not found.',
            }),
          ],
        }),
      );
    });

    it('403 не владелец поста', async () => {
      ownershipGuard.canActivate.mockResolvedValue(false);

      await request(app.getHttpServer())
        .delete(`/posts/${mockPost.id}`)
        .set('Authorization', `Bearer ${mockTokens.accessToken}`)
        .expect(HttpStatus.FORBIDDEN);

      expect(commandBus.execute).not.toHaveBeenCalled();
    });
  });
});
