export class MockPostsRepository {
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
}
