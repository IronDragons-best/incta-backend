import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { CommandBus, CqrsModule, QueryBus } from '@nestjs/cqrs';
import { HttpModule, HttpService } from '@nestjs/axios';
import { of } from 'rxjs';
import request from 'supertest';
import cookieParser from 'cookie-parser';

import {
  AppConfigService,
  NotificationInterceptor,
  NotificationService,
  AppNotification,
} from '@common';
import { AsyncLocalStorageService, CustomLogger } from '@monitoring';

import { PostsController } from '../../src/modules/posts/interface/posts.controller';
import { PostsRepository } from '../../src/modules/posts/infrastructure/posts.repository';
import { PostsQueryRepository } from '../../src/modules/posts/infrastructure/posts.query.repository';
import { PostsService } from '../../src/modules/posts/application/post.service';
import { CreatePostUseCase } from '../../src/modules/posts/application/use-case/create.post.use.case';
import { PostEntity } from '../../src/modules/posts/domain/post.entity';
import { PostFileEntity } from '../../src/modules/posts/domain/post.file.entity';
import { JwtStrategy } from '../../core/guards/local/jwt.strategy';
import { JwtAuthGuard } from '../../core/guards/local/jwt-auth-guard';
import { AuthService } from '../../src/modules/auth/application/auth.service';
import { LocalStrategy } from '../../core/guards/local/local.strategy';
import { LocalAuthGuard } from '../../core/guards/local/local.auth.guard';
import { UsersRepository } from '../../src/modules/users/infrastructure/users.repository';
import { CryptoService } from '../../src/modules/users/application/crypto.service';
import { DataSource } from 'typeorm';

import { MockAppConfigService, MockHttpService } from '../mocks/common.mocks';
import {
  MockPostsRepository,
  MockPostsQueryRepository,
  MockDataSource,
} from '../mocks/post.flow.mocks';
import { MockUsersRepository } from '../mocks/user.flow.mocks';
import { MockCryptoService } from '../mocks/auth.flow.mocks';

describe('Create Post Integration Tests', () => {
  let app: INestApplication;
  let postsQueryRepository: MockPostsQueryRepository;
  let httpService: MockHttpService;
  let jwtService: JwtService;
  let commandBus: { execute: jest.Mock; publish: jest.Mock };
  let createPostUseCase: jest.Mocked<CreatePostUseCase>;

  const createValidToken = (userId: number): string => {
    return jwtService.sign(
      { id: userId },
      { secret: 'testAccessSecret', expiresIn: '1h' },
    );
  };

  const createMockPost = (
    id: number,
    userId: number,
    title: string,
    description: string,
    files: PostFileEntity[] = [],
  ): PostEntity => {
    const post = new PostEntity();
    post.id = id;
    post.title = title;
    post.shortDescription = description;
    post.userId = userId;
    (post as any).user = { id: userId, username: 'test-user' };
    post.createdAt = new Date();
    post.updatedAt = new Date();
    post.files = files;
    return post;
  };

  const createMockPostFile = (
    id: number,
    fileName: string,
    fileUrl: string,
  ): PostFileEntity => {
    const file = new PostFileEntity();
    file.id = id;
    file.fileName = fileName;
    file.fileUrl = fileUrl;
    return file;
  };

  const setupFileServiceMock = (uploadResults: any[] = []) => {
    httpService.post = jest.fn().mockReturnValue(
      of({
        data: { uploadResults, errors: [] },
      }),
    );
  };

  beforeEach(async () => {
    const commandBusMock = {
      execute: jest.fn(),
      publish: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        PassportModule,
        JwtModule.register({
          secret: 'testAccessSecret',
          signOptions: { expiresIn: '1h' },
        }),
        CqrsModule,
        HttpModule,
      ],
      controllers: [PostsController],
      providers: [
        AuthService,
        LocalStrategy,
        LocalAuthGuard,
        JwtStrategy,
        QueryBus,

        JwtAuthGuard,
        PostsService,
        JwtService,
        {
          provide: CreatePostUseCase,
          useValue: { execute: jest.fn() },
        },
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
          provide: CryptoService,
          useClass: MockCryptoService,
        },
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
        {
          provide: AppConfigService,
          useClass: MockAppConfigService,
        },
        {
          provide: UsersRepository,
          useClass: MockUsersRepository,
        },
        {
          provide: AsyncLocalStorageService,
          useValue: { get: jest.fn(), set: jest.fn() },
        },
        {
          provide: CommandBus,
          useValue: commandBusMock,
        },
        {
          provide: DataSource,
          useClass: MockDataSource,
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

    postsQueryRepository = module.get<MockPostsQueryRepository>(PostsQueryRepository);
    httpService = module.get<MockHttpService>(HttpService);
    jwtService = module.get<JwtService>(JwtService);
    commandBus = commandBusMock;
    createPostUseCase = module.get<CreatePostUseCase>(
      CreatePostUseCase,
    ) as jest.Mocked<CreatePostUseCase>;

    commandBus.execute.mockImplementation((command) => {
      if (command.constructor.name === 'CreatePostCommand') {
        return createPostUseCase.execute(command);
      }
      return Promise.resolve(AppNotification.success({}));
    });
  });

  afterEach(async () => {
    await app.close();
    jest.clearAllMocks();
  });

  describe('POST /posts/create-post', () => {
    it('201 - should successfully create a post', async () => {
      const userId = 1;
      const validAccessToken = createValidToken(userId);
      const postData = {
        title: 'Test Post Title',
        shortDescription: 'Test post description',
      };
      const createdPost = createMockPost(
        99,
        userId,
        postData.title,
        postData.shortDescription,
      );

      setupFileServiceMock([
        {
          originalName: 'test-file.jpg',
          uploadedUrl: 'https://example.com/files/test-file.jpg',
        },
      ]);
      createPostUseCase.execute.mockResolvedValue(AppNotification.success(createdPost));
      postsQueryRepository.getPostByIdWithUserId.mockResolvedValue(createdPost);

      const response = await request(app.getHttpServer())
        .post('/posts/create-post')
        .set('Cookie', [`accessToken=${validAccessToken}`])
        .set('Content-Type', 'multipart/form-data')
        .field('title', postData.title)
        .field('shortDescription', postData.shortDescription)
        .attach('files', Buffer.from('fake image data'), {
          filename: 'test-file.jpg',
          contentType: 'image/jpeg',
        })
        .expect(201);

      expect(createPostUseCase.execute).toHaveBeenCalled();
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

      const validAccessToken = jwtService.sign(
        { id: userId },
        { secret: 'testAccessSecret', expiresIn: '1h' },
      );

      const postData = {
        title: 'Test Post with Files',
        shortDescription: 'Test post with file attachments',
      };

      const createdPost = new PostEntity();
      createdPost.id = 2;
      createdPost.title = postData.title;
      createdPost.shortDescription = postData.shortDescription;
      createdPost.userId = userId;
      (createdPost as any).user = { id: userId, username: 'test-user' };
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

      const successNotification = AppNotification.success(createdPost);
      createPostUseCase.execute.mockResolvedValue(successNotification);

      postsQueryRepository.getPostByIdWithUserId.mockResolvedValue(createdPost);

      const response = await request(app.getHttpServer())
        .post('/posts/create-post')
        .set('Cookie', [`accessToken=${validAccessToken}`])
        .set('Content-Type', 'multipart/form-data')
        .field('title', postData.title)
        .field('shortDescription', postData.shortDescription)
        .attach('files', Buffer.from('fake image data'), {
          filename: 'test-file.jpg',
          contentType: 'image/jpeg',
        })
        .expect(201);

      expect(createPostUseCase.execute).toHaveBeenCalled();
      expect(postsQueryRepository.getPostByIdWithUserId).toHaveBeenCalledWith(
        createdPost.id,
        userId,
      );

      expect(response.body).toEqual(
        expect.objectContaining({
          id: createdPost.id,
          title: createdPost.title,
          shortDescription: createdPost.shortDescription,
          previewImages: expect.arrayContaining([postFile.fileUrl]),
          user: expect.objectContaining({
            userId: createdPost.userId,
            username: 'test-user',
          }),
          createdAt: expect.any(String),
        }),
      );
    });

    it('400 - should return bad request when title is missing', async () => {
      const userId = 1;

      const accessTokenPayload = {
        id: userId,
      };

      const validAccessToken = jwtService.sign(accessTokenPayload, {
        secret: 'testAccessSecret',
        expiresIn: '1h',
      });

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
        .set('Cookie', [`accessToken=${validAccessToken}`])
        .set('Content-Type', 'multipart/form-data')
        .field('shortDescription', 'Test description without title')
        .expect(400);

      expect(createPostUseCase.execute).not.toHaveBeenCalled();
    });

    it('401 - should return unauthorized when access token is missing', async () => {
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

      expect(createPostUseCase.execute).not.toHaveBeenCalled();
    });

    it('401 - should return unauthorized when access token is invalid', async () => {
      const invalidToken = 'invalid-token';

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
        .set('Cookie', [`accessToken=${invalidToken}`])
        .set('Content-Type', 'multipart/form-data')
        .field('title', 'Test Post')
        .field('shortDescription', 'Test description')
        .expect(401);

      expect(createPostUseCase.execute).not.toHaveBeenCalled();
    });
  });
});
