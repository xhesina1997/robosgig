import { Injectable, BadRequestException, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { StripeService } from '../stripe/stripe.service';
import Stripe from 'stripe';

export type PlanType = 'WORKER_PRO' | 'CLIENT_BUSINESS';

const PLAN_LABELS: Record<PlanType, string> = {
  WORKER_PRO: 'Worker Pro',
  CLIENT_BUSINESS: 'Client Business',
};

const PLAN_PRICES: Record<PlanType, number> = {
  WORKER_PRO: 1999,       // €19.99 in cents
  CLIENT_BUSINESS: 2999,  // €29.99 in cents
};

@Injectable()
export class SubscriptionsService {
  constructor(
    private prisma: PrismaService,
    private stripe: StripeService,
    private config: ConfigService,
  ) {}

  async getMySubscription(userId: string) {
    const sub = await this.prisma.subscription.findUnique({ where: { userId } });
    return sub ?? { planType: 'FREE', isActive: false };
  }

  async createCheckoutSession(userId: string, planType: PlanType) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });
    if (!user) throw new NotFoundException('User not found');

    // Validate plan matches role
    if (planType === 'WORKER_PRO' && user.role !== 'WORKER') {
      throw new BadRequestException('Worker Pro is only available for workers');
    }
    if (planType === 'CLIENT_BUSINESS' && user.role !== 'CLIENT') {
      throw new BadRequestException('Client Business is only available for clients');
    }

    const stripeKey = this.config.get<string>('STRIPE_SECRET_KEY') ?? '';
    const stripeReady = stripeKey && !stripeKey.includes('YOUR_KEY_HERE') && !stripeKey.includes('placeholder');

    if (!stripeReady) {
      throw new ServiceUnavailableException(
        'Stripe is not configured yet. Add STRIPE_SECRET_KEY to your .env file.',
      );
    }

    // Get or create Stripe customer
    let stripeCustomerId = user.subscription?.stripeCustomerId;
    if (!stripeCustomerId) {
      try {
        const customer = await this.stripe.createCustomer(user.email);
        stripeCustomerId = customer.id;
      } catch (err: unknown) {
        throw new ServiceUnavailableException(
          `Stripe error: ${(err as { message?: string }).message ?? 'Could not create customer'}`,
        );
      }
    }

    const priceId = planType === 'WORKER_PRO'
      ? this.config.get('STRIPE_WORKER_PRO_PRICE_ID')
      : this.config.get('STRIPE_CLIENT_BUSINESS_PRICE_ID');

    const frontendUrl = this.config.get('FRONTEND_URL');
    const priceReady = priceId && !priceId.includes('HERE');

    const sessionParams: Stripe.Checkout.SessionCreateParams = priceReady
      ? {
          customer: stripeCustomerId,
          mode: 'subscription',
          line_items: [{ price: priceId as string, quantity: 1 }],
          success_url: `${frontendUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}&plan=${planType}`,
          cancel_url: `${frontendUrl}/pricing`,
          metadata: { userId, planType },
        }
      : {
          customer: stripeCustomerId,
          mode: 'payment',
          line_items: [{
            price_data: {
              currency: 'eur',
              product_data: { name: PLAN_LABELS[planType] + ' (Monthly)' },
              unit_amount: PLAN_PRICES[planType],
            },
            quantity: 1,
          }],
          success_url: `${frontendUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}&plan=${planType}`,
          cancel_url: `${frontendUrl}/pricing`,
          metadata: { userId, planType },
        };

    let session: Stripe.Checkout.Session;
    try {
      session = await this.stripe.createCheckoutSession(sessionParams);
    } catch (err: unknown) {
      throw new ServiceUnavailableException(
        `Stripe error: ${(err as { message?: string }).message ?? 'Could not create checkout session'}`,
      );
    }

    // Pre-save customer ID
    await this.prisma.subscription.upsert({
      where: { userId },
      create: { userId, planType: 'FREE', stripeCustomerId, isActive: false },
      update: { stripeCustomerId },
    });

    return { url: session.url };
  }

  async handleWebhook(payload: Buffer, signature: string) {
    const secret = this.config.get<string>('STRIPE_WEBHOOK_SECRET') ?? '';
    if (!secret || secret.includes('HERE')) {
      // Dev fallback: skip signature verification
      return { received: true };
    }

    let event: Stripe.Event;
    try {
      event = this.stripe.constructWebhookEvent(payload, signature, secret);
    } catch {
      throw new BadRequestException('Invalid webhook signature');
    }

    await this.processWebhookEvent(event);
    return { received: true };
  }

  // Called directly from success endpoint in dev (no webhook setup)
  async activateSubscription(userId: string, planType: string, sessionId: string) {
    await this.prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        planType: planType as PlanType,
        isActive: true,
      },
      update: {
        planType: planType as PlanType,
        isActive: true,
      },
    });
    return { activated: true };
  }

  async cancelSubscription(userId: string) {
    const sub = await this.prisma.subscription.findUnique({ where: { userId } });
    if (!sub?.isActive) throw new BadRequestException('No active subscription');

    if (sub.stripeSubscriptionId) {
      await this.stripe.cancelSubscription(sub.stripeSubscriptionId);
    }

    await this.prisma.subscription.update({
      where: { userId },
      data: { isActive: false, planType: 'FREE' },
    });

    return { cancelled: true };
  }

  private async processWebhookEvent(event: Stripe.Event) {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const { userId, planType } = session.metadata ?? {};
        if (!userId || !planType) break;

        await this.prisma.subscription.upsert({
          where: { userId },
          create: {
            userId,
            planType: planType as PlanType,
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: session.subscription as string | undefined,
            isActive: true,
          },
          update: {
            planType: planType as PlanType,
            stripeSubscriptionId: session.subscription as string | undefined,
            isActive: true,
          },
        });
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await this.prisma.subscription.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: { isActive: false, planType: 'FREE' },
        });
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await this.prisma.subscription.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            isActive: subscription.status === 'active',
            currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
          },
        });
        break;
      }
    }
  }
}
