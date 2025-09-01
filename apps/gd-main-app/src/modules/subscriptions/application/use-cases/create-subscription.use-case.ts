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
    const notify = this.notification.create();

    const user: User | null = await this.usersRepository.findById(command.userId);

    if (!user) {
      this.logger.warn(`User with id ${command.userId} not found`);
      return notify.setNotFound('User not found');
    }

    const userSubscription: UserSubscriptionEntity = user.createSubscriptionForUser(
      command.planType,
      command.paymentMethod,
    );

    const paymentUrl = this.createPayment(userSubscription);
    const sub = this.subscriptionRepository.save(userSubscription);
  }

  private createPayment(subscription: UserSubscriptionEntity) {
    // request logic
    return 'https://stripe-url.com/will/be/here';
  }
}
/// Создать payment дублирующую сущность. доделать логику создания подписки и payment entity
