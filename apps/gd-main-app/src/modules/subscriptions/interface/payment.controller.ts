// Для обработки неудачной оплаты
import { Controller } from '@nestjs/common';
import { EventPattern, Payload, Transport } from '@nestjs/microservices';
import { PaymentMethodType, PaymentStatusType, PlanType } from '@common';

interface PaymentSuccessPayload {
  userId: number;
  externalSubscriptionId: string; // для обновления subscriptionId
  status: PaymentStatusType; // PaymentStatusType
  startDate: string; // ISO string
  endDate: string; // ISO string
  planType: PlanType; // PlanType
  paymentMethod: PaymentMethodType; // PaymentMethodType

  // Для создания PaymentInfoEntity
  paymentAmount: number;
  externalPaymentId: string; // Stripe: pi_xxx, PayPal: PAYID-xxx
  billingDate: string; // ISO string
}

interface PaymentFailedPayload {
  userId: number;
  externalSubscriptionId: string; // ID подписки у провайдера
  errorCode: string;
  errorMessage: string;
  planType: PlanType;
  attemptedAmount: number;
  currency: string;
  failureDate: string; // ISO string
  paymentMethod: PaymentMethodType;

  // Дополнительная информация о попытке
  retryAttempt?: number;
  nextRetryDate?: string;
}

// Для отмены подписки
interface SubscriptionCancelledPayload {
  userId: number;
  stripeSubscriptionId: string;
  cancelledAt: string; // ISO string
  reason?: string;
  // Для обновления status в 'Cancelled' и установки canceledAt
}

// Для истечения подписки
interface SubscriptionExpiredPayload {
  userId: number;
  stripeSubscriptionId: string;
  expiredAt: string; // ISO string
  lastPaymentAmount?: number;
  // Для обновления status в 'Expired'
}

// Для Past Due статуса
interface SubscriptionPastDuePayload {
  userId: number;
  stripeSubscriptionId: string;
  pastDueDate: string; // ISO string
  unpaidAmount: number;
  // Для обновления status в 'PastDue'
}

interface SubscriptionAutoPaymentCancelledPayload {
  userId: number;
  stripeSubscriptionId: string;
  cancelledAt: string; // когда было отключено авто-продление
  reason?: string; // например, 'user_request' или 'payment_failed'
  currentPeriodEnd: string; // дата конца текущего оплаченного периода
}

@Controller()
export class PaymentEventsController {
  @EventPattern('payment.success', Transport.RMQ)
  async handlePaymentSuccess(@Payload() data: PaymentSuccessPayload) {
    console.log('[Payment Success] Received event:', data);

    // TODO: Здесь будет вызов use case для:
    // 1. Обновления UserSubscriptionEntity (status, subscriptionId, startDate, endDate)
    // 2. Создания PaymentInfoEntity
    // await this.paymentSuccessUseCase.execute(data);

    console.log(
      `Payment for user ${data.userId} completed, subscription: ${data.externalSubscriptionId}`,
    );
  }

  @EventPattern('payment.failed', Transport.RMQ)
  async handlePaymentFailed(@Payload() data: PaymentFailedPayload) {
    console.log('[Payment Failed] Received event:', data);

    // TODO: Здесь будет вызов use case для обработки неудачной оплаты
    // Возможно обновление status на 'Failed' или логирование попытки
    // await this.paymentFailedUseCase.execute(data);

    console.log(`Payment failed for user ${data.userId}: ${data.errorMessage}`);
  }

  @EventPattern('subscription.cancelled', Transport.RMQ)
  async handleSubscriptionCancelled(@Payload() data: SubscriptionCancelledPayload) {
    console.log('[Subscription Cancelled] Received event:', data);

    // TODO: Обновление UserSubscriptionEntity:
    // - status = 'Cancelled'
    // - canceledAt = data.cancelledAt
    // await this.subscriptionCancelledUseCase.execute(data);

    console.log(`Subscription cancelled for user ${data.userId} at ${data.cancelledAt}`);
  }

  @EventPattern('subscription.expired', Transport.RMQ)
  async handleSubscriptionExpired(@Payload() data: SubscriptionExpiredPayload) {
    console.log('[Subscription Expired] Received event:', data);

    // TODO: Обновление UserSubscriptionEntity status = 'Expired'
    // await this.subscriptionExpiredUseCase.execute(data);

    console.log(`Subscription expired for user ${data.userId} at ${data.expiredAt}`);
  }

  @EventPattern('subscription.past_due', Transport.RMQ)
  async handleSubscriptionPastDue(@Payload() data: SubscriptionPastDuePayload) {
    console.log('[Subscription Past Due] Received event:', data);

    // TODO: Обновление UserSubscriptionEntity status = 'PastDue'
    // await this.subscriptionPastDueUseCase.execute(data);

    console.log(
      `Subscription past due for user ${data.userId}, amount: ${data.unpaidAmount}`,
    );
  }

  @EventPattern('subscription.auto_payment_cancelled', Transport.RMQ)
  async handleSubscriptionAutoPaymentCancelled(
    @Payload() data: SubscriptionAutoPaymentCancelledPayload,
  ) {
    console.log('[Auto Payment Cancelled] Received event:', data);

    // TODO: обновление UserSubscriptionEntity:
    // - возможно добавить флаг autoRenew = false
    // - оставляем endDate = data.currentPeriodEnd
    // await this.subscriptionAutoPaymentCancelledUseCase.execute(data);

    console.log(
      `Auto payment cancelled for user ${data.userId}, subscription remains active until ${data.currentPeriodEnd}`,
    );
  }
}
