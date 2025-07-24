import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

export class UploadFileCommand {
  constructor() {}
}

@CommandHandler(UploadFileCommand)
export class UploadFileUseCase implements ICommandHandler<UploadFileCommand> {
  constructor() {}
  async execute(command: UploadFileCommand) {}
}
