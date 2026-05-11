import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { StripeService } from '../stripe/stripe.service';
import Stripe from 'stripe';

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private stripe: StripeService,
    private config: ConfigService,
  ) {}

  /**
   * Create a Stripe Checkout session for paying for a completed job.
   * The client pays → Stripe redirects to /payment/success → confirmJobPayment is called.
   */
  async createJobCheckoutSession(userId: string, jobId: string) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: {
        applications: { where: { status: 'ACCEPTED' } },
        client: {
          select: {
            email: true,
            subscription: true,
            clientProfile: { select: { id: true, stripeCustomerId: true } },
          },
        },
      },
    });
    if (!job) throw new NotFoundException('Job not found');
    if (job.clientId !== userId) throw new ForbiddenException('Not your job');
    if (job.status !== 'ASSIGNED') {
      throw new BadRequestException('Job must be ASSIGNED (worker accepted) before funding escrow');
    }

    // Verify Stripe is configured
    const stripeKey = this.config.get<string>('STRIPE_SECRET_KEY') ?? '';
    if (!stripeKey || stripeKey.includes('placeholder')) {
      throw new ServiceUnavailableException('Stripe is not configured');
    }

    const acceptedApp = job.applications[0];
    const totalAmount = acceptedApp?.proposedPrice ?? job.priceMax ?? job.priceMin ?? 0;

    if (totalAmount <= 0) {
      throw new BadRequestException('Cannot process payment: no price set for this job');
    }

    // Resolve or create the Stripe Customer for this client so their card gets saved
    let stripeCustomerId = job.client.clientProfile?.stripeCustomerId
      ?? job.client.subscription?.stripeCustomerId
      ?? null;

    if (!stripeCustomerId) {
      const customer = await this.stripe.createCustomer(job.client.email);
      stripeCustomerId = customer.id;
      if (job.client.clientProfile?.id) {
        await this.prisma.clientProfile.update({
          where: { id: job.client.clientProfile.id },
          data: { stripeCustomerId },
        });
      }
    }

    // Stripe works in cents
    const amountCents = Math.round(totalAmount * 100);

    const frontendUrl = this.config.get('APP_FRONTEND_URL') ?? 'http://localhost:4200';

    let session: Stripe.Checkout.Session;
    try {
      session = await this.stripe.createCheckoutSession({
        mode: 'payment',
        customer: stripeCustomerId,
        payment_intent_data: { setup_future_usage: 'off_session' },
        line_items: [{
          price_data: {
            currency: 'eur',
            product_data: {
              name: job.title,
              description: `Payment for job: ${job.title}`,
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        }],
        success_url: `${frontendUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}&job_id=${jobId}`,
        cancel_url: `${frontendUrl}/dashboard/client`,
        metadata: { userId, jobId },
      });
    } catch (err: unknown) {
      throw new ServiceUnavailableException(
        `Stripe error: ${(err as { message?: string }).message ?? 'Could not create checkout session'}`,
      );
    }

    // Pre-create a PENDING payment record with the session ID
    await this.prisma.payment.upsert({
      where: { jobId },
      create: {
        jobId,
        totalAmount,
        platformFeePercent: 0,
        platformFeeAmount: 0,
        workerPayout: totalAmount,
        status: 'PENDING',
        stripeSessionId: session.id,
      },
      update: {
        totalAmount,
        status: 'PENDING',
        stripeSessionId: session.id,
      },
    });

    return { url: session.url };
  }

  /**
   * Called after Stripe redirects to /payment/success.
   * Verifies the session was paid, calculates fees, marks job COMPLETED.
   */
  async confirmJobPayment(userId: string, jobId: string, sessionId?: string) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: {
        applications: {
          where: { status: 'ACCEPTED' },
          include: { worker: { select: { stripeConnectId: true, stripeConnectOnboarded: true } } },
        },
      },
    });
    if (!job) throw new NotFoundException('Job not found');
    if (job.clientId !== userId) throw new ForbiddenException('Not your job');

    // Look up payment; if sessionId provided, verify it matches
    const payment = await this.prisma.payment.findUnique({ where: { jobId } });
    if (!payment) throw new BadRequestException('No payment record found for this job');
    if (sessionId && payment.stripeSessionId !== sessionId) {
      throw new BadRequestException('Payment session mismatch');
    }
    const resolvedSessionId = sessionId ?? payment.stripeSessionId;
    if (!resolvedSessionId) throw new BadRequestException('No Stripe session found for this payment');

    if ((payment.status as string) === 'ESCROWED' || payment.status === 'COMPLETED') {
      // Already escrowed/completed — ensure job is IN_PROGRESS/COMPLETED
      if (job.status === 'ASSIGNED') {
        await this.prisma.job.update({ where: { id: jobId }, data: { status: 'IN_PROGRESS' } });
      }
      return this.prisma.job.findUnique({ where: { id: jobId } });
    }

    // Verify with Stripe that the session was actually paid
    let stripeSession: Stripe.Checkout.Session;
    try {
      stripeSession = await this.stripe.client.checkout.sessions.retrieve(resolvedSessionId);
    } catch (err: unknown) {
      throw new ServiceUnavailableException(
        `Stripe error: ${(err as { message?: string }).message ?? 'Could not verify payment'}`,
      );
    }

    if (stripeSession.payment_status !== 'paid') {
      throw new BadRequestException('Payment has not been completed');
    }

    const totalAmount = payment.totalAmount;
    const acceptedApp = job.applications[0];

    // Determine fee rate based on subscriptions
    const [workerSub, clientSub] = await Promise.all([
      acceptedApp
        ? this.prisma.subscription.findUnique({
            where: {
              userId: (await this.prisma.workerProfile.findUnique({
                where: { id: acceptedApp.workerId },
                select: { userId: true },
              }))!.userId,
            },
          })
        : Promise.resolve(null),
      this.prisma.subscription.findUnique({ where: { userId: job.clientId } }),
    ]);

    const [feeDefault, feeWorkerPro, feeClientBusiness] = await Promise.all([
      this.prisma.platformSetting.findUnique({ where: { key: 'fee.default' } }),
      this.prisma.platformSetting.findUnique({ where: { key: 'fee.workerPro' } }),
      this.prisma.platformSetting.findUnique({ where: { key: 'fee.clientBusiness' } }),
    ]);
    let feePercent = parseInt(feeDefault?.value ?? '15');
    if (workerSub?.isActive && workerSub.planType === 'WORKER_PRO') feePercent = parseInt(feeWorkerPro?.value ?? '12');
    else if (clientSub?.isActive && clientSub.planType === 'CLIENT_BUSINESS') feePercent = parseInt(feeClientBusiness?.value ?? '10');

    const platformFeeAmount = Math.round(totalAmount * feePercent) / 100;
    const workerPayout = totalAmount - platformFeeAmount;

    // Escrow the payment and move job to IN_PROGRESS — payout releases when client marks complete
    await this.prisma.$transaction([
      this.prisma.payment.update({
        where: { jobId },
        data: { platformFeePercent: feePercent, platformFeeAmount, workerPayout, status: 'ESCROWED' },
      }),
      this.prisma.job.update({
        where: { id: jobId },
        data: { status: 'IN_PROGRESS' },
      }),
    ]);

    return { jobId, totalAmount, platformFeePercent: feePercent, platformFeeAmount, workerPayout, status: 'ESCROWED' };
  }

  /** Returns the payment record for a job (client only). */
  async getJobPayment(userId: string, jobId: string) {
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Job not found');
    if (job.clientId !== userId) throw new ForbiddenException('Not your job');

    return this.prisma.payment.findUnique({ where: { jobId } });
  }

  /** Returns saved payment methods for the authenticated client. */
  async getSavedPaymentMethods(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        clientProfile: { select: { id: true, stripeCustomerId: true } },
        subscription: { select: { stripeCustomerId: true } },
      },
    });
    if (!user?.clientProfile) return [];

    const stripeCustomerId = user.clientProfile.stripeCustomerId
      ?? user.subscription?.stripeCustomerId
      ?? null;
    if (!stripeCustomerId) return [];

    const stripeKey = this.config.get<string>('STRIPE_SECRET_KEY') ?? '';
    if (!stripeKey || stripeKey.includes('placeholder')) return [];

    // Backfill clientProfile.stripeCustomerId from subscription if it was missing —
    // keeps the two in sync going forward.
    if (user.clientProfile.stripeCustomerId !== stripeCustomerId) {
      await this.prisma.clientProfile.update({
        where: { id: user.clientProfile.id },
        data: { stripeCustomerId },
      });
    }

    try {
      const methods = await this.stripe.listPaymentMethods(stripeCustomerId);
      return methods.data.map(m => ({
        id: m.id,
        brand: m.card?.brand ?? 'card',
        last4: m.card?.last4 ?? '????',
        expMonth: m.card?.exp_month,
        expYear: m.card?.exp_year,
        funding: m.card?.funding,
      }));
    } catch {
      return [];
    }
  }

  /**
   * Creates a Stripe SetupIntent so the client can add a card inline via Stripe Elements.
   * Returns the client secret which the frontend uses with stripe.confirmCardSetup().
   */
  async createSetupIntent(userId: string) {
    const stripeKey = this.config.get<string>('STRIPE_SECRET_KEY') ?? '';
    if (!stripeKey || stripeKey.includes('placeholder')) {
      throw new ServiceUnavailableException('Stripe is not configured');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        clientProfile: { select: { id: true, stripeCustomerId: true } },
        subscription: { select: { stripeCustomerId: true } },
      },
    });
    if (!user?.clientProfile) throw new NotFoundException('Client profile not found');

    let stripeCustomerId = user.clientProfile.stripeCustomerId
      ?? user.subscription?.stripeCustomerId
      ?? null;

    if (!stripeCustomerId) {
      const customer = await this.stripe.createCustomer(user.email);
      stripeCustomerId = customer.id;
    }

    // Always sync the resolved customer id onto clientProfile so the rest of the
    // app (saved-cards list, etc.) can find it via the client profile.
    if (user.clientProfile.stripeCustomerId !== stripeCustomerId) {
      await this.prisma.clientProfile.update({
        where: { id: user.clientProfile.id },
        data: { stripeCustomerId },
      });
    }

    try {
      const intent = await this.stripe.client.setupIntents.create({
        customer: stripeCustomerId,
        payment_method_types: ['card'],
        usage: 'off_session',
        metadata: { userId, purpose: 'add-card' },
      });
      return { clientSecret: intent.client_secret };
    } catch (err: unknown) {
      throw new ServiceUnavailableException(
        `Stripe error: ${(err as { message?: string }).message ?? 'Could not create setup intent'}`,
      );
    }
  }

  /** Detaches a saved payment method from the client's Stripe customer. */
  async removePaymentMethod(userId: string, methodId: string) {
    const profile = await this.prisma.clientProfile.findUnique({
      where: { userId },
      select: { stripeCustomerId: true },
    });
    if (!profile?.stripeCustomerId) throw new ForbiddenException('No saved payment methods');

    const stripeKey = this.config.get<string>('STRIPE_SECRET_KEY') ?? '';
    if (!stripeKey || stripeKey.includes('placeholder')) {
      throw new ServiceUnavailableException('Stripe is not configured');
    }

    const method = await this.stripe.client.paymentMethods.retrieve(methodId);
    if (method.customer !== profile.stripeCustomerId) {
      throw new ForbiddenException('Not your payment method');
    }

    await this.stripe.detachPaymentMethod(methodId);
    return { removed: true };
  }
}
