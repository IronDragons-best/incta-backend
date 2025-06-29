import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { GetAllUsersQuery } from '../application/query-handlers/get.all.users.query.handler';
import { GetUserQuery } from '../application/query-handlers/get.user.query.handler';
import { UserInputDto } from './dto/user.input.dto';
import { CreateUserCommand } from '../application/use-cases/create.user.use.case';
import { DeleteUserCommand } from '../application/use-cases/delete.user.use.case';
import { ApiResponse } from '@nestjs/swagger';

@Controller('users')
export class UsersController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}
  @Get()
  @ApiResponse({ status: 200, description: 'Success' })
  getUsers() {
    return this.queryBus.execute(new GetAllUsersQuery());
  }
  @Get(':id')
  @ApiResponse({ status: 201, description: 'Success' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  getUserById(@Param('id') id: number) {
    return this.queryBus.execute(new GetUserQuery(id));
  }

  @Post()
  @ApiResponse({ status: 201, description: 'Returns the newly created user' })
  @ApiResponse({ status: 400, description: 'If the inputModel has incorrect values' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  createUser(@Body() body: UserInputDto) {
    return this.commandBus.execute(new CreateUserCommand(body));
  }
  @Delete(':id')
  @ApiResponse({ status: 201, description: 'Success' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  deleteUser(@Param('id') id: number) {
    return this.commandBus.execute(new DeleteUserCommand(id));
  }
}
