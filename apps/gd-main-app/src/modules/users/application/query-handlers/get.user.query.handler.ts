import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { UsersQueryRepository } from '../../infrastructure/users.query.repository';
import { NotFoundException } from '@nestjs/common';

export class GetUserQuery {
  constructor(public userId: number) {}
}

@QueryHandler(GetUserQuery)
export class GetUserHandler implements IQueryHandler<GetUserQuery> {
  constructor(private readonly usersQueryRepository: UsersQueryRepository) {}

  async execute(query: GetUserQuery) {
    const user = await this.usersQueryRepository.getUserById(query.userId);
    if (!user) {
      throw new NotFoundException(`User with id ${query.userId} not found`);
    }
    return user;
  }
}
