import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

export class CreateProfileCommand {
  constructor() {}
}

@CommandHandler(CreateProfileCommand)
export class CreateProfileUseCase implements ICommandHandler<CreateProfileCommand> {
  async execute() {}
}
