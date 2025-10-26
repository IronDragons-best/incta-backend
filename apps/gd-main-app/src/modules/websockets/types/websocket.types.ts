export enum NotificationType {
  PAYMENT_SUCCESS = 'payment_success',
  SUBSCRIPTION_ACTIVATED = 'subscription_activated',
  SUBSCRIPTION_CHARGE_WARNING = 'subscription_charge_warning',
  SUBSCRIPTION_EXPIRING_REMINDER = 'subscription_expiring_reminder',
}

export interface NotificationData {
  type: NotificationType;
  userId: number;
  data: PaymentSuccessData | SubscriptionData;
  message: string;
}

export interface PaymentSuccessData {
  planType: string;
  paymentMethod: string;
  subscriptionDuration: string;
  endDate: string;
}

export interface SubscriptionData {
  planType: string;
  endDate: string;
  daysUntilExpiration?: number;
  chargeDate?: string;
  amount?: number;
}
