export enum PlanType {
  MONTHLY = 'monthly',
  THREE_MONTH = '3month',
  SIX_MONTH = '6month',
  YEARLY = 'yearly',
}

export enum SubscriptionPlan {
  Business = 'business',
  Personal = 'personal',
}

export enum SubscriptionStatusType {
  ACTIVE = 'ACTIVE',
  CANCELED = 'CANCELED',
  PAST_DUE = 'PAST_DUE',
  INCOMPLETE = 'INCOMPLETE',
  INCOMPLETE_EXPIRED = 'INCOMPLETE_EXPIRED',
  TRIALING = 'TRIALING',
  UNPAID = 'UNPAID',
}

export enum PaymentStatusType {
  'Processing' = 'processing', // Платеж обрабатывается
  'Succeeded' = 'succeeded', // Успешно оплачен
  'Failed' = 'failed', // Платеж не прошел
  'Refunded' = 'refunded', // Возвращен
  'Cancelled' = 'cancelled', // Отменен до завершения
}

export enum PaymentMethodType {
  Stripe = 'stripe',
  Paypal = 'paypal',
}

export interface RefundProcessedPayload {
  userId: number;
  externalSubscriptionId: string;
  externalRefundId: string; // Stripe: re_xxx
  refundAmount: number;
  currency: string;
  refundDate: string; // ISO string
  reason: string; // 'requested_by_customer', 'fraudulent', etc.
  originalPaymentId: string; // ID изначального платежа
}

export interface PaymentSuccessPayload {
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

export interface PaymentFailedPayload {
  userId: number;
  externalSubscriptionId: string; // ID подписки у провайдера
  status: PaymentStatusType;
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
export interface SubscriptionCancelledPayload {
  userId: number;
  externalSubscriptionId: string;
  cancelledAt: string; // ISO string
  status: SubscriptionStatusType;
  reason?: string;
  // Для обновления status в 'Cancelled' и установки canceledAt
}

// Для истечения подписки
export interface SubscriptionExpiredPayload {
  userId: number;
  externalSubscriptionId: string;
  expiredAt: string; // ISO string
  lastPaymentAmount?: number;
  // Для обновления status в 'Expired'
}

// Для Past Due статуса
export interface SubscriptionPastDuePayload {
  userId: number;
  externalSubscriptionId: string;
  pastDueDate: string; // ISO string
  unpaidAmount: number;
  // Для обновления status в 'PastDue'
}

export interface SubscriptionAutoPaymentCancelledPayload {
  userId: number;
  stripeSubscriptionId: string;
  cancelledAt: string; // когда было отключено авто-продление
  reason?: string; // например, 'user_request' или 'payment_failed'
  currentPeriodEnd: string; // дата конца текущего оплаченного периода
}

export interface StripeLineItemPeriod {
  start: number;
  end: number;
}

export interface StripeLineItem {
  id: string;
  amount: number;
  currency: string;
  description: string;
  period: StripeLineItemPeriod;
}
