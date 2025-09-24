export enum NotificationType {
  PAYMENT_SUCCESS = 'payment_success',
}

export interface NotificationData {
  type: NotificationType;
  userId: number;
  data: PaymentSuccessData;
  message: string;
}

export interface PaymentSuccessData {
  planType: string;
  paymentMethod: string;
  subscriptionDuration: string;
  endDate: string;
}
