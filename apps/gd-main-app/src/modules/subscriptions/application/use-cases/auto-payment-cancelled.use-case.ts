import { SubscriptionAutoPaymentCancelledPayload } from '@common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CustomLogger } from '@monitoring';
// ARCHIVE ??
export class AutoPaymentCancelledCommand {
  constructor(public payload: SubscriptionAutoPaymentCancelledPayload) {}
}

@CommandHandler(AutoPaymentCancelledCommand)
export class AutoPaymentCancelledUseCase
  implements ICommandHandler<AutoPaymentCancelledCommand>
{
  constructor(private readonly logger: CustomLogger) {
    this.logger.setContext('AutoPaymentCancelledUseCase');
  }
  async execute(command: AutoPaymentCancelledCommand) {
    this.logger.warn(
      `AutoPaymentCancelledUseCase executed with command: ${command.payload.stripeSubscriptionId}`,
    );
    return;
  }
}
