// Stripe PaymentIntent типы
export interface StripePaymentIntent {
  id: string;
  customer: string;
  amount: number;
  currency: string;
  status:
    | 'requires_payment_method'
    | 'requires_confirmation'
    | 'requires_action'
    | 'processing'
    | 'requires_capture'
    | 'canceled'
    | 'succeeded';
  last_payment_error?: {
    code?: string;
    message?: string;
    type?: string;
  };
  metadata?: {
    subscription_id?: string;
    [key: string]: string | undefined;
  };
}

// Stripe Invoice типы
export interface StripeInvoice {
  id: string;
  customer: string;
  subscription: string | null;
  amount_paid: number;
  amount_due: number;
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  period_start: number;
  period_end: number;
  status_transitions: {
    paid_at: number;
    voided_at?: number;
    finalized_at?: number;
  };
}

// Stripe Subscription типы
export interface StripeSubscription {
  id: string;
  customer: string;
  status:
    | 'incomplete'
    | 'incomplete_expired'
    | 'trialing'
    | 'active'
    | 'past_due'
    | 'canceled'
    | 'unpaid';
  start_date?: number;
  current_period_start?: number;
  current_period_end?: number;
  cancel_at?: number | null;
  canceled_at?: number | null;
  cancel_at_period_end?: boolean;
  cancellation_details?: {
    cancellation_reason?: 'user_request' | 'automatic' | 'fraud' | 'non_payment';
    comment?: string;
  } | null;
  latest_invoice?: string;
  metadata?: {
    [key: string]: string;
  };
}

export interface StripeCheckoutSession {
  id: string;
  customer: string | null;
  subscription: string | null;
  payment_intent: string | null;
  mode: 'payment' | 'setup' | 'subscription';
  status: 'open' | 'complete' | 'expired';
  url: string | null;
  success_url: string;
  cancel_url: string;
  metadata?: {
    paymentId?: string;
    [key: string]: string | undefined;
  };
}
