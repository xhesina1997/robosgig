import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { StripeService } from '../stripe/stripe.service';
import { Resend } from 'resend';
import Stripe from 'stripe';

@Injectable()
export class VerifyService {
  private readonly logger = new Logger(VerifyService.name);
  private readonly resend: Resend;

  constructor(
    private prisma: PrismaService,
    private stripe: StripeService,
    private config: ConfigService,
  ) {
    this.resend = new Resend(this.config.get<string>('RESEND_API_KEY'));
  }

  async getStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { idVerified: true, verification: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return {
      idVerified: user.idVerified,
      verification: user.verification ?? null,
    };
  }

  async createSession(userId: string) {
    const existing = await this.prisma.identityVerification.findUnique({ where: { userId } });
    if (existing?.status === 'VERIFIED') {
      throw new BadRequestException('Already verified');
    }

    const session = await this.stripe.client.identity.verificationSessions.create({
      type: 'document',
      options: {
        document: {
          require_live_capture: true,
          require_matching_selfie: true,
        },
      },
      metadata: { userId },
    });

    await this.prisma.identityVerification.upsert({
      where: { userId },
      create: { userId, stripeSessionId: session.id, status: 'PENDING' },
      update: { stripeSessionId: session.id, status: 'PENDING', submittedAt: new Date(), reviewedAt: null },
    });


    return { clientSecret: session.client_secret };
  }

  async handleWebhook(payload: Buffer, sig: string) {
    const secret = this.config.get<string>('STRIPE_IDENTITY_WEBHOOK_SECRET') ?? '';
    let event: Stripe.Event;

    try {
      event = this.stripe.constructWebhookEvent(payload, sig, secret);
    } catch {
      throw new BadRequestException('Invalid webhook signature');
    }

    if (event.type === 'identity.verification_session.verified') {
      const session = event.data.object as Stripe.Identity.VerificationSession;
      const userId = session.metadata?.userId;
      if (!userId) return;

      await this.prisma.$transaction([
        this.prisma.identityVerification.updateMany({
          where: { stripeSessionId: session.id },
          data: { status: 'VERIFIED', reviewedAt: new Date() },
        }),
        this.prisma.user.update({
          where: { id: userId },
          data: { idVerified: true },
        }),
      ]);

      await this.sendVerifiedEmail(userId);
    }

    if (event.type === 'identity.verification_session.requires_input') {
      const session = event.data.object as Stripe.Identity.VerificationSession;
      await this.prisma.identityVerification.updateMany({
        where: { stripeSessionId: session.id },
        data: { status: 'REJECTED', reviewedAt: new Date() },
      });
    }
  }

  private async sendVerifiedEmail(userId: string) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          email: true,
          workerProfile: { select: { firstName: true } },
          clientProfile: { select: { firstName: true } },
        },
      });
      if (!user) return;

      const firstName = user.workerProfile?.firstName ?? user.clientProfile?.firstName ?? 'there';
      const from = this.config.get<string>('RESEND_FROM') ?? 'RobosGig <noreply@robosgig.com>';

      await this.resend.emails.send({
        from,
        to: user.email,
        subject: '✅ Your identity has been verified — RobosGig',
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
            <img src="https://robosgig.com/logo.svg" width="32" height="32" alt="RobosGig" style="margin-bottom:24px" />
            <h2 style="margin:0 0 12px;font-size:20px;color:#18181b">Hey ${firstName}, you're verified! 🎉</h2>
            <p style="color:#52525b;line-height:1.6;margin:0 0 24px">
              Your identity has been successfully verified on RobosGig.
              Your profile now shows a verified badge, which helps you get more jobs and builds trust with clients.
            </p>
            <a href="https://app.robosgig.com/dashboard"
               style="display:inline-block;background:#18181b;color:#fff;text-decoration:none;padding:12px 24px;border-radius:99px;font-weight:600;font-size:14px">
              Go to your dashboard
            </a>
            <p style="color:#a1a1aa;font-size:12px;margin-top:32px">RobosGig · Vienna, Austria</p>
          </div>
        `,
      });
    } catch (err) {
      this.logger.error('Failed to send verified email', err);
    }
  }
}
