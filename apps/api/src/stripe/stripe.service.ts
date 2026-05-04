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

  retrieveCustomer(customerId: string) {
    return this.client.customers.retrieve(customerId);
  }

  listPaymentMethods(customerId: string) {
    return this.client.paymentMethods.list({ customer: customerId, type: 'card' });
  }

  createConnectAccount(email: string) {
    return this.client.accounts.create({ type: 'express', email, capabilities: { transfers: { requested: true } } });
  }

  retrieveConnectAccount(accountId: string) {
    return this.client.accounts.retrieve(accountId);
  }

  createAccountLink(accountId: string, refreshUrl: string, returnUrl: string) {
    return this.client.accountLinks.create({ account: accountId, refresh_url: refreshUrl, return_url: returnUrl, type: 'account_onboarding' });
  }

  createLoginLink(accountId: string) {
    return this.client.accounts.createLoginLink(accountId);
  }

  createTransfer(amountCents: number, currency: string, destination: string, metadata: Record<string, string> = {}) {
    return this.client.transfers.create({ amount: amountCents, currency, destination, metadata });
  }

  detachPaymentMethod(methodId: string) {
    return this.client.paymentMethods.detach(methodId);
  }
}
