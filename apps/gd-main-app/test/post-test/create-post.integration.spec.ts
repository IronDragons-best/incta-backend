import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { CommandBus, CqrsModule } from '@nestjs/cqrs';
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

import { MockAppConfigService, MockHttpService } from '../mocks/common.mocks';
import { MockPostsRepository, MockPostsQueryRepository, MockDataSource } from '../mocks/post.flow.mocks';
import { DataSource } from 'typeorm';
import { AuthService } from '../../src/modules/auth/application/auth.service';
import { LocalStrategy } from '../../core/guards/local/local.strategy';
import { LocalAuthGuard } from '../../core/guards/local/local.auth.guard';
import { UsersRepository } from '../../src/modules/users/infrastructure/users.repository';
import { MockUsersRepository } from '../mocks/user.flow.mocks';
import { CryptoService } from '../../src/modules/users/application/crypto.service';
import { MockCryptoService } from '../mocks/auth.flow.mocks';

describe('Create Post Integration Tests', () => {
  let app: INestApplication;
  let postsRepository: MockPostsRepository;
  let postsQueryRepository: MockPostsQueryRepository;
  let httpService: MockHttpService;
  let jwtService: JwtService;
  let commandBus: { execute: jest.Mock; publish: jest.Mock };
  let createPostUseCase: jest.Mocked<CreatePostUseCase>;

  let notificationService: NotificationService;
  let cryptoService: MockCryptoService;

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
        JwtAuthGuard,
        {
          provide: CreatePostUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
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
          provide: CryptoService,
          useClass: MockCryptoService,
        },
        {
          provide: CustomLogger,
          useValue: { setContext: jest.fn(), warn: jest.fn(), error: jest.fn(), log: jest.fn() },
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
        JwtService,
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
    commandBus = commandBusMock;
    createPostUseCase = module.get<CreatePostUseCase>(CreatePostUseCase) as jest.Mocked<CreatePostUseCase>;
    cryptoService = module.get<MockCryptoService>(CryptoService);
    notificationService = module.get<NotificationService>(NotificationService);

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

      const tokenPayload = { id: userId };

      const validAccessToken = jwtService.sign(tokenPayload, {
        secret: 'testAccessSecret',
        expiresIn: '1h',
      });

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

      httpService.post = jest.fn().mockReturnValue(of({
        data: {
          uploadResults: [
            { originalName: 'test-file.jpg', uploadedUrl: 'https://example.com/files/test-file.jpg' }
          ],
          errors: []
        }
      }));

      const successNotification = AppNotification.success(createdPost);
      createPostUseCase.execute.mockResolvedValue(successNotification);

      postsQueryRepository.getPostByIdWithUserId.mockResolvedValue(createdPost);

      const response = await request(app.getHttpServer())
        .post('/posts/create-post')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .set('Content-Type', 'multipart/form-data')
        .field('title', postData.title)
        .field('shortDescription', postData.shortDescription)
        .attach('files', Buffer.from('fake image data'), {
          filename: 'test-file.jpg',
          contentType: 'image/jpeg',
        })
        .expect(201);

      expect(createPostUseCase.execute).toHaveBeenCalled();
      expect(postsQueryRepository.getPostByIdWithUserId).toHaveBeenCalledWith(createdPost.id, userId);
      expect(response.body).toEqual(expect.objectContaining({
        id: createdPost.id,
        title: createdPost.title,
        shortDescription: createdPost.shortDescription,
      }));
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
              { originalName: 'test-file.jpg', uploadedUrl: 'https://example.com/files/test-file.jpg' },
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
        .set('Authorization', `Bearer ${validAccessToken}`)
        .set('Content-Type', 'multipart/form-data')
        .field('title', postData.title)
        .field('shortDescription', postData.shortDescription)
        .attach('files', Buffer.from('fake image data'), {
          filename: 'test-file.jpg',
          contentType: 'image/jpeg',
        })
        .expect(201);

      expect(createPostUseCase.execute).toHaveBeenCalled();
      expect(postsQueryRepository.getPostByIdWithUserId).toHaveBeenCalledWith(createdPost.id, userId);

      expect(response.body).toEqual(
        expect.objectContaining({
          id: createdPost.id,
          title: createdPost.title,
          shortDescription: createdPost.shortDescription,
          userId: createdPost.userId,
          previewImages: expect.arrayContaining([postFile.fileUrl]),
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

      httpService.post = jest.fn().mockReturnValue(of({
        data: {
          uploadResults: [],
          errors: []
        }
      }));

      await request(app.getHttpServer())
        .post('/posts/create-post')
        .set('Authorization', `Bearer ${validAccessToken}`)
        .set('Content-Type', 'multipart/form-data')
        .field('shortDescription', 'Test description without title')
        .expect(400);

      expect(createPostUseCase.execute).not.toHaveBeenCalled();
    });

    it('401 - should return unauthorized when access token is missing', async () => {
      httpService.post = jest.fn().mockReturnValue(of({
        data: {
          uploadResults: [],
          errors: []
        }
      }));

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

      httpService.post = jest.fn().mockReturnValue(of({
        data: {
          uploadResults: [],
          errors: []
        }
      }));

      await request(app.getHttpServer())
        .post('/posts/create-post')
        .set('Authorization', `Bearer ${invalidToken}`)
        .set('Content-Type', 'multipart/form-data')
        .field('title', 'Test Post')
        .field('shortDescription', 'Test description')
        .expect(401);

      expect(createPostUseCase.execute).not.toHaveBeenCalled();
    });
  });
});
