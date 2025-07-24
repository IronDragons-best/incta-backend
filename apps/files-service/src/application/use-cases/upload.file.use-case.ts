import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

export class UploadFileCommand {
  constructor() {}
}

@CommandHandler(UploadFileCommand)
export class UploadUseCase implements ICommandHandler<UploadFileCommand> {
  constructor() {}
  async execute(command: UploadFileCommand) {}
}
