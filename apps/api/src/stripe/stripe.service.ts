import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  readonly client: Stripe;

  constructor(private config: ConfigService) {
    this.client = new Stripe(this.config.get<string>('STRIPE_SECRET_KEY') ?? 'sk_test_placeholder', {
      apiVersion: '2025-02-24.acacia' as Stripe.LatestApiVersion,
    });
  }

  createCheckoutSession(params: Stripe.Checkout.SessionCreateParams) {
    return this.client.checkout.sessions.create(params);
  }

  constructWebhookEvent(payload: Buffer, sig: string, secret: string) {
    return this.client.webhooks.constructEvent(payload, sig, secret);
  }

  cancelSubscription(subscriptionId: string) {
    return this.client.subscriptions.cancel(subscriptionId);
  }

  createCustomer(email: string) {
    return this.client.customers.create({ email });
  }
}
