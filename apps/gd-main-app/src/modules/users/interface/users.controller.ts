import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { GetAllUsersQuery } from '../application/query-handlers/get.all.users.query.handler';
import { GetUserQuery } from '../application/query-handlers/get.user.query.handler';
import { UserInputDto } from './dto/user.input.dto';
import { CreateUserCommand } from '../application/use-cases/create.user.use.case';
import { DeleteUserCommand } from '../application/use-cases/delete.user.use.case';
import { UseNotificationInterceptor } from '@common';

@Controller('users')
export class UsersController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}
  @Get()
  getUsers() {
    return this.queryBus.execute(new GetAllUsersQuery());
  }
  @Get(':id')
  getUserById(@Param('id') id: number) {
    return this.queryBus.execute(new GetUserQuery(id));
  }

  @Post()
  createUser(@Body() body: UserInputDto) {
    return this.commandBus.execute(new CreateUserCommand(body));
  }
  @Delete(':id')
  deleteUser(@Param('id') id: number) {
    return this.commandBus.execute(new DeleteUserCommand(id));
  }
}
