export enum PlanType {
  Monthly = 'monthly',
  Yearly = 'yearly',
}

export enum SubscriptionPlan {
  Business = 'business',
  Personal = 'personal',
}

export enum PaymentStatusType {
  'Pending' = 'pending',
  'Active' = 'active',
  'Canceled' = 'canceled',
  'Expired' = 'expired',
  'Past_due' = 'past_due',
}

export enum PaymentMethodType {
  Stripe = 'stripe',
  Paypal = 'paypal',
}
