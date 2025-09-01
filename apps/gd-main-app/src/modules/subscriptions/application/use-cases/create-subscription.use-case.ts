import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CustomLogger } from '@monitoring';
import { NotificationService, PaymentMethodType, PlanType } from '@common';
import { UsersRepository } from '../../../users/infrastructure/users.repository';
import { User } from '../../../users/domain/user.entity';
import { SubscriptionRepository } from '../../infrastructure/subscription.repository';
import { UserSubscriptionEntity } from '../../domain/user-subscription.entity';

export class CreateSubscriptionCommand {
  constructor(
    public userId: number,
    public planType: PlanType,
    public paymentMethod: PaymentMethodType,
    public duration: number,
  ) {}
}

@CommandHandler(CreateSubscriptionCommand)
export class CreateSubscriptionUseCase
  implements ICommandHandler<CreateSubscriptionCommand>
{
  constructor(
    private readonly logger: CustomLogger,
    private readonly notification: NotificationService,
    private readonly usersRepository: UsersRepository,
    private readonly subscriptionRepository: SubscriptionRepository,
  ) {
    this.logger.setContext('CreateSubscriptionUseCase');
  }
  async execute(command: CreateSubscriptionCommand) {
    const notify = this.notification.create<{
      subscriptionId: number;
      checkoutUrl: string;
    }>();

    if (command.planType === PlanType.Yearly && command.duration > 1) {
      return notify.setBadRequest(
        'The maximum subscription period is 1 year.',
        'duration',
      );
    }

    const user: User | null = await this.usersRepository.findById(command.userId);

    if (!user) {
      this.logger.warn(`User with id ${command.userId} not found`);
      return notify.setNotFound('User not found');
    }

    const result = this.createPayment();
    const userSubscription: UserSubscriptionEntity = user.createSubscriptionForUser(
      command.planType,
      command.paymentMethod,
      result.subscriptionId,
    );
    const sub = await this.subscriptionRepository.save(userSubscription);
    return notify.setValue({
      subscriptionId: sub.id,
      checkoutUrl: result.paymentUrl,
    });
  }

  private createPayment() {
    // request logic
    return {
      paymentUrl: 'https://stripe-url.com/will/be/here',
      subscriptionId: 'someID',
      status: 'pending',
    };
  }
}
/// Создать payment дублирующую сущность. доделать логику создания подписки и payment entity
