import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersRepository } from '../../infrastructure/users.repository';
import { UserInputDto } from '../../interface/dto/user.input.dto';
import { BadRequestException } from '@nestjs/common';
import { User } from '../../domain/user.entity';

export class CreateUserCommand {
  constructor(public userDto: UserInputDto) {}
}

@CommandHandler(CreateUserCommand)
export class CreateUserUseCase implements ICommandHandler<CreateUserCommand> {
  constructor(private readonly usersRepository: UsersRepository) {}
  async execute(command: CreateUserCommand) {
    const userWithTheSameLoginOrEmail = await this.usersRepository.findExistingByLoginOrEmail(
      command.userDto.login,
      command.userDto.email,
    );

    if (userWithTheSameLoginOrEmail) {
      throw new BadRequestException(`${userWithTheSameLoginOrEmail.field} already taken`);
    }

    const userEntity = User.createInstance({
      login: command.userDto.login,
      password: command.userDto.password,
      email: command.userDto.email,
    });

    return this.usersRepository.createUser(userEntity);
  }
}
