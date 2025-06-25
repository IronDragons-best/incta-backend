import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { UsersQueryRepository } from '../../infrastructure/users.query.repository';

export class GetAllUsersQuery {
  constructor() {}
}

@QueryHandler(GetAllUsersQuery)
export class GetAllUsersHandler implements IQueryHandler<GetAllUsersQuery> {
  constructor(private readonly usersQueryRepository: UsersQueryRepository) {}

  async execute() {
    const users = await this.usersQueryRepository.getUsers();
    if (!users.length) {
      return [];
    }
    return users;
  }
}
