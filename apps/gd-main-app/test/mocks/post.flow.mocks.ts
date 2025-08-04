import { Request } from 'express';

export class MockPostsRepository {
  checkOwnership = jest.fn();
  findByIdWithTransaction = jest.fn();
  saveWithTransaction = jest.fn();
  savePostWithFiles = jest.fn();
  findById = jest.fn();
}

export class MockPostsQueryRepository {
  getPostByIdWithUserId = jest.fn();
}

export class MockQueryRunner {
  manager = {
    save: jest.fn().mockImplementation((entity, data) => data),
  };
  connect = jest.fn().mockResolvedValue(undefined);
  startTransaction = jest.fn().mockResolvedValue(undefined);
  commitTransaction = jest.fn().mockResolvedValue(undefined);
  rollbackTransaction = jest.fn().mockResolvedValue(undefined);
  release = jest.fn().mockResolvedValue(undefined);
}

export class MockDataSource {
  createQueryRunner = jest.fn().mockReturnValue(new MockQueryRunner());
  query = jest.fn();
}

export class MockJwtAuthGuard {
  canActivate = jest.fn().mockImplementation((context) => {
    const request: Request = context.switchToHttp().getRequest();
    request.user = { id: 1 };
    return true;
  });
}

export class MockOwnershipGuard {
  canActivate = jest.fn();
}

export class MockPostsService {
  updatePost = jest.fn();
}
