import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { CqrsModule } from '@nestjs/cqrs';
import { HttpModule, HttpService } from '@nestjs/axios';
import { of } from 'rxjs';
import request from 'supertest';
import cookieParser from 'cookie-parser';

import { AppConfigService, NotificationInterceptor, NotificationService } from '@common';
import { AsyncLocalStorageService, CustomLogger } from '@monitoring';

import { PostsController } from '../../src/modules/posts/interface/posts.controller';
import { PostsRepository } from '../../src/modules/posts/infrastructure/posts.repository';
import { PostsQueryRepository } from '../../src/modules/posts/infrastructure/posts.query.repository';
import { CreatePostUseCase } from '../../src/modules/posts/application/use-case/create.post.use.case';
import { PostsService } from '../../src/modules/posts/application/post.service';
import { PostEntity } from '../../src/modules/posts/domain/post.entity';
import { PostFileEntity } from '../../src/modules/posts/domain/post.file.entity';

import { JwtRefreshStrategy } from '../../core/guards/refresh/jwt.refresh.strategy';
import { RefreshGuard } from '../../core/guards/refresh/jwt.refresh.auth.guard';

import {
  MockAppConfigService,
  MockCommandBus,
  MockHttpService,
} from '../mocks/common.mocks';
import {
  MockPostsRepository,
  MockPostsQueryRepository,
  MockDataSource,
} from '../mocks/post.flow.mocks';
import { DataSource } from 'typeorm';
import { TokenService } from '../../src/modules/auth/application/use-cases/token.service';

describe('Create Post Integration Tests', () => {
  let app: INestApplication;
  let postsRepository: MockPostsRepository;
  let postsQueryRepository: MockPostsQueryRepository;
  let httpService: MockHttpService;
  let jwtService: JwtService;
  let commandBus: MockCommandBus;
  let notificationService: NotificationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PassportModule, JwtModule.register({}), CqrsModule, HttpModule],
      controllers: [PostsController],
      providers: [
        CreatePostUseCase,
        PostsService,
        NotificationService,
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
          provide: PostsRepository,
          useClass: MockPostsRepository,
        },
        {
          provide: PostsQueryRepository,
          useClass: MockPostsQueryRepository,
        },
        {
          provide: HttpService,
          useClass: MockHttpService,
        },
        JwtRefreshStrategy,
        RefreshGuard,
        JwtService,
        {
          provide: AppConfigService,
          useClass: MockAppConfigService,
        },
        {
          provide: AsyncLocalStorageService,
          useValue: { get: jest.fn(), set: jest.fn() },
        },
        {
          provide: 'CommandBus',
          useClass: MockCommandBus,
        },
        {
          provide: DataSource,
          useClass: MockDataSource,
        },
        {
          provide: TokenService,
          useValue: {
            verifyToken: jest.fn(),
            signToken: jest.fn(),
          },
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
    app.use(cookieParser());
    await app.init();

    postsRepository = module.get<MockPostsRepository>(PostsRepository);
    postsQueryRepository = module.get<MockPostsQueryRepository>(PostsQueryRepository);
    httpService = module.get<MockHttpService>(HttpService);
    jwtService = module.get<JwtService>(JwtService);
    commandBus = module.get<MockCommandBus>('CommandBus');
    notificationService = module.get<NotificationService>(NotificationService);
  });

  afterEach(async () => {
    await app.close();
    jest.clearAllMocks();
  });

  describe('POST /posts/create-post', () => {
    it('201 - should successfully create a post', async () => {
      const userId = 1;
      const sessionId = 'test-session-123';

      const refreshTokenPayload = {
        id: userId,
        sessionId: sessionId,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      const validRefreshToken = jwtService.sign(refreshTokenPayload, {
        secret: 'testRefreshSecret',
      });

      const refreshCookie = `refreshToken=${validRefreshToken}; SameSite=lax; HttpOnly`;

      const postData = {
        title: 'Test Post Title',
        shortDescription: 'Test post description',
      };

      const createdPost = new PostEntity();
      createdPost.id = 1;
      createdPost.title = postData.title;
      createdPost.shortDescription = postData.shortDescription;
      createdPost.userId = userId;
      createdPost.createdAt = new Date();
      createdPost.updatedAt = new Date();
      createdPost.files = [];

      httpService.post = jest.fn().mockReturnValue(
        of({
          data: {
            uploadResults: [
              {
                originalName: 'test-file.jpg',
                uploadedUrl: 'https://example.com/files/test-file.jpg',
              },
            ],
            errors: [],
          },
        }),
      );

      commandBus.execute.mockResolvedValue({
        hasErrors: () => false,
        getValue: () => createdPost,
      });

      postsQueryRepository.getPostByIdWithUserId.mockResolvedValue(createdPost);

      const response = await request(app.getHttpServer())
        .post('/posts/create-post')
        .set('Cookie', refreshCookie)
        .set('Content-Type', 'multipart/form-data')
        .field('title', postData.title)
        .field('shortDescription', postData.shortDescription)
        .attach('files', Buffer.from('fake image data'), {
          filename: 'test-file.jpg',
          contentType: 'image/jpeg',
        })
        .expect(201);

      expect(commandBus.execute).toHaveBeenCalled();
      expect(postsQueryRepository.getPostByIdWithUserId).toHaveBeenCalledWith(
        createdPost.id,
        userId,
      );
      expect(response.body).toEqual(
        expect.objectContaining({
          id: createdPost.id,
          title: createdPost.title,
          shortDescription: createdPost.shortDescription,
        }),
      );
    });

    it('201 - should successfully create a post with files', async () => {
      const userId = 1;
      const sessionId = 'test-session-123';

      const refreshTokenPayload = {
        id: userId,
        sessionId: sessionId,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      const validRefreshToken = jwtService.sign(refreshTokenPayload, {
        secret: 'testRefreshSecret',
      });

      const refreshCookie = `refreshToken=${validRefreshToken}; SameSite=lax; HttpOnly`;

      const postData = {
        title: 'Test Post with Files',
        shortDescription: 'Test post with file attachments',
      };

      const createdPost = new PostEntity();
      createdPost.id = 2;
      createdPost.title = postData.title;
      createdPost.shortDescription = postData.shortDescription;
      createdPost.userId = userId;
      createdPost.createdAt = new Date();
      createdPost.updatedAt = new Date();

      const postFile = new PostFileEntity();
      postFile.id = 1;
      postFile.fileName = 'test-file.jpg';
      postFile.fileUrl = 'https://example.com/files/test-file.jpg';
      postFile.post = createdPost;

      createdPost.files = [postFile];

      httpService.post = jest.fn().mockReturnValue(
        of({
          data: {
            uploadResults: [
              {
                originalName: 'test-file.jpg',
                uploadedUrl: 'https://example.com/files/test-file.jpg',
              },
            ],
            errors: [],
          },
        }),
      );

      commandBus.execute.mockResolvedValue({
        hasErrors: () => false,
        getValue: () => createdPost,
      });

      postsQueryRepository.getPostByIdWithUserId.mockResolvedValue(createdPost);

      const response = await request(app.getHttpServer())
        .post('/posts/create-post')
        .set('Cookie', refreshCookie)
        .set('Content-Type', 'multipart/form-data')
        .field('title', postData.title)
        .field('shortDescription', postData.shortDescription)
        .attach('files', Buffer.from('fake image data'), {
          filename: 'test-file.jpg',
          contentType: 'image/jpeg',
        })
        .expect(201);

      expect(commandBus.execute).toHaveBeenCalled();
      expect(postsQueryRepository.getPostByIdWithUserId).toHaveBeenCalledWith(
        createdPost.id,
        userId,
      );
      expect(response.body).toEqual(
        expect.objectContaining({
          id: createdPost.id,
          title: createdPost.title,
          shortDescription: createdPost.shortDescription,
          files: expect.arrayContaining([
            expect.objectContaining({
              fileName: postFile.fileName,
              fileUrl: postFile.fileUrl,
            }),
          ]),
        }),
      );
    });

    it('400 - should return bad request when title is missing', async () => {
      const userId = 1;
      const sessionId = 'test-session-123';

      const refreshTokenPayload = {
        id: userId,
        sessionId: sessionId,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      const validRefreshToken = jwtService.sign(refreshTokenPayload, {
        secret: 'testRefreshSecret',
      });

      const refreshCookie = `refreshToken=${validRefreshToken}; SameSite=lax; HttpOnly`;

      httpService.post = jest.fn().mockReturnValue(
        of({
          data: {
            uploadResults: [],
            errors: [],
          },
        }),
      );

      await request(app.getHttpServer())
        .post('/posts/create-post')
        .set('Cookie', refreshCookie)
        .set('Content-Type', 'multipart/form-data')
        .field('shortDescription', 'Test description without title')
        .expect(400);

      expect(commandBus.execute).not.toHaveBeenCalled();
    });

    it('401 - should return unauthorized when refresh token is missing', async () => {
      httpService.post = jest.fn().mockReturnValue(
        of({
          data: {
            uploadResults: [],
            errors: [],
          },
        }),
      );

      await request(app.getHttpServer())
        .post('/posts/create-post')
        .set('Content-Type', 'multipart/form-data')
        .field('title', 'Test Post')
        .field('shortDescription', 'Test description')
        .expect(401);

      expect(commandBus.execute).not.toHaveBeenCalled();
    });

    it('401 - should return unauthorized when refresh token is invalid', async () => {
      const invalidCookie = 'refreshToken=invalid-token; HttpOnly; SameSite=lax';

      httpService.post = jest.fn().mockReturnValue(
        of({
          data: {
            uploadResults: [],
            errors: [],
          },
        }),
      );

      await request(app.getHttpServer())
        .post('/posts/create-post')
        .set('Cookie', invalidCookie)
        .set('Content-Type', 'multipart/form-data')
        .field('title', 'Test Post')
        .field('shortDescription', 'Test description')
        .expect(401);

      expect(commandBus.execute).not.toHaveBeenCalled();
    });
  });
});
