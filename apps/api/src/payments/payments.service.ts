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
        client: { select: { email: true, subscription: true } },
      },
    });
    if (!job) throw new NotFoundException('Job not found');
    if (job.clientId !== userId) throw new ForbiddenException('Not your job');
    if (!['ASSIGNED', 'IN_PROGRESS'].includes(job.status)) {
      throw new BadRequestException('Job must be ASSIGNED or IN_PROGRESS to pay');
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

    // Stripe works in cents
    const amountCents = Math.round(totalAmount * 100);

    const frontendUrl = this.config.get('FRONTEND_URL');

    let session: Stripe.Checkout.Session;
    try {
      session = await this.stripe.createCheckoutSession({
        mode: 'payment',
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
  async confirmJobPayment(userId: string, jobId: string, sessionId: string) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: {
        applications: { where: { status: 'ACCEPTED' } },
      },
    });
    if (!job) throw new NotFoundException('Job not found');
    if (job.clientId !== userId) throw new ForbiddenException('Not your job');

    // Check payment record matches session
    const payment = await this.prisma.payment.findUnique({ where: { jobId } });
    if (!payment || payment.stripeSessionId !== sessionId) {
      throw new BadRequestException('Payment session mismatch');
    }
    if (payment.status === 'COMPLETED') {
      // Already processed — just return current job state
      return this.prisma.job.findUnique({ where: { id: jobId } });
    }

    // Verify with Stripe that the session was actually paid
    let stripeSession: Stripe.Checkout.Session;
    try {
      stripeSession = await this.stripe.client.checkout.sessions.retrieve(sessionId);
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

    let feePercent = 15;
    if (workerSub?.isActive && workerSub.planType === 'WORKER_PRO') feePercent = 12;
    else if (clientSub?.isActive && clientSub.planType === 'CLIENT_BUSINESS') feePercent = 10;

    const platformFeeAmount = Math.round(totalAmount * feePercent) / 100;
    const workerPayout = totalAmount - platformFeeAmount;

    // Finalize payment + complete job in a transaction
    await this.prisma.$transaction([
      this.prisma.payment.update({
        where: { jobId },
        data: {
          platformFeePercent: feePercent,
          platformFeeAmount,
          workerPayout,
          status: 'COMPLETED',
        },
      }),
      this.prisma.job.update({
        where: { id: jobId },
        data: { status: 'COMPLETED' },
      }),
      ...(acceptedApp
        ? [
            this.prisma.workerProfile.update({
              where: { id: acceptedApp.workerId },
              data: { totalJobs: { increment: 1 } },
            }),
          ]
        : []),
    ]);

    return {
      jobId,
      totalAmount,
      platformFeePercent: feePercent,
      platformFeeAmount,
      workerPayout,
      status: 'COMPLETED',
    };
  }

  /** Returns the payment record for a job (client only). */
  async getJobPayment(userId: string, jobId: string) {
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Job not found');
    if (job.clientId !== userId) throw new ForbiddenException('Not your job');

    return this.prisma.payment.findUnique({ where: { jobId } });
  }
}
