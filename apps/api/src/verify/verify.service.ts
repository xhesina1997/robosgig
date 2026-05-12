import { Injectable, BadRequestException, NotFoundException, Logger, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { StripeService } from '../stripe/stripe.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Resend } from 'resend';
import Stripe from 'stripe';

/**
 * Stripe Identity supported countries (ISO 3166-1 alpha-2). All other countries
 * fall through to manual admin review.
 */
const STRIPE_IDENTITY_COUNTRIES = new Set([
  'AT', 'AU', 'BE', 'BG', 'CA', 'CH', 'CY', 'CZ', 'DE', 'DK', 'EE', 'ES', 'FI',
  'FR', 'GB', 'GR', 'HR', 'HU', 'IE', 'IT', 'JP', 'LT', 'LU', 'LV', 'MT', 'MX',
  'NL', 'NO', 'NZ', 'PL', 'PT', 'RO', 'SE', 'SG', 'SI', 'SK', 'US',
]);

@Injectable()
export class VerifyService {
  private readonly logger = new Logger(VerifyService.name);
  private readonly resend: Resend;

  constructor(
    private prisma: PrismaService,
    private stripe: StripeService,
    private config: ConfigService,
    private notifications: NotificationsService,
  ) {
    this.resend = new Resend(this.config.get<string>('RESEND_API_KEY') ?? 'placeholder');
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

  /**
   * Starts a verification flow. Country is required so we can choose Stripe
   * Identity (supported countries) vs manual admin review (everywhere else).
   * Returns either `{ method: 'STRIPE', clientSecret }` or `{ method: 'MANUAL' }`.
   */
  async createSession(userId: string, country?: string | null) {
    const existing = await this.prisma.identityVerification.findUnique({ where: { userId } });
    if (existing?.status === 'VERIFIED') {
      throw new BadRequestException('Already verified');
    }
    if (!country) {
      throw new BadRequestException('Country is required');
    }

    const cc = country.toUpperCase();

    if (!STRIPE_IDENTITY_COUNTRIES.has(cc)) {
      // No Stripe session — frontend should upload docs via submitManual.
      await this.prisma.identityVerification.upsert({
        where: { userId },
        create: { userId, status: 'PENDING', method: 'MANUAL', country: cc, stripeSessionId: null },
        update: { status: 'PENDING', method: 'MANUAL', country: cc, stripeSessionId: null, submittedAt: new Date(), reviewedAt: null, rejectionReason: null },
      });
      return { method: 'MANUAL' as const };
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
      create: { userId, stripeSessionId: session.id, status: 'PENDING', method: 'STRIPE', country: cc },
      update: { stripeSessionId: session.id, status: 'PENDING', method: 'STRIPE', country: cc, submittedAt: new Date(), reviewedAt: null, rejectionReason: null },
    });

    return { method: 'STRIPE' as const, clientSecret: session.client_secret };
  }

  /**
   * Receives Cloudinary URLs from the frontend after a non-Stripe-country user
   * uploads their ID + selfie. Sets status PENDING for admin review.
   */
  async submitManual(
    userId: string,
    dto: { country: string; idFrontUrl: string; idBackUrl?: string | null; selfieUrl: string },
  ) {
    const existing = await this.prisma.identityVerification.findUnique({ where: { userId } });
    if (existing?.status === 'VERIFIED') {
      throw new BadRequestException('Already verified');
    }
    if (!dto.idFrontUrl || !dto.selfieUrl) {
      throw new BadRequestException('ID front and selfie are required');
    }

    return this.prisma.identityVerification.upsert({
      where: { userId },
      create: {
        userId,
        status: 'PENDING',
        method: 'MANUAL',
        country: dto.country.toUpperCase(),
        idFrontUrl: dto.idFrontUrl,
        idBackUrl: dto.idBackUrl ?? null,
        selfieUrl: dto.selfieUrl,
      },
      update: {
        status: 'PENDING',
        method: 'MANUAL',
        country: dto.country.toUpperCase(),
        idFrontUrl: dto.idFrontUrl,
        idBackUrl: dto.idBackUrl ?? null,
        selfieUrl: dto.selfieUrl,
        rejectionReason: null,
        submittedAt: new Date(),
        reviewedAt: null,
      },
    });
  }

  /** Admin: approve a manual submission. Flips user.idVerified, fires email. */
  async adminApprove(verificationId: string, documentType?: string | null) {
    const v = await this.prisma.identityVerification.findUnique({ where: { id: verificationId } });
    if (!v) throw new NotFoundException('Verification not found');
    if (v.method !== 'MANUAL') throw new BadRequestException('Only manual submissions can be approved by admin');

    await this.prisma.$transaction([
      this.prisma.identityVerification.update({
        where: { id: verificationId },
        data: {
          status: 'VERIFIED',
          reviewedAt: new Date(),
          rejectionReason: null,
          documentType: documentType ?? v.documentType ?? null,
        },
      }),
      this.prisma.user.update({ where: { id: v.userId }, data: { idVerified: true } }),
    ]);

    await this.sendVerifiedEmail(v.userId);
    this.notifications.create({
      userId: v.userId,
      type: 'ID_VERIFIED',
      title: 'Identity verified',
      body: 'Your ID was approved. Your profile now shows the verified badge.',
      link: '/worker/profile',
    });
    return { ok: true };
  }

  /** Admin: reject a manual submission with optional reason. */
  async adminReject(verificationId: string, reason?: string) {
    const v = await this.prisma.identityVerification.findUnique({ where: { id: verificationId } });
    if (!v) throw new NotFoundException('Verification not found');
    if (v.method !== 'MANUAL') throw new BadRequestException('Only manual submissions can be rejected by admin');

    await this.prisma.identityVerification.update({
      where: { id: verificationId },
      data: { status: 'REJECTED', reviewedAt: new Date(), rejectionReason: reason ?? null },
    });
    this.notifications.create({
      userId: v.userId,
      type: 'ID_REJECTED',
      title: 'ID verification declined',
      body: reason ?? 'Please try again with a clearer document and selfie.',
      link: '/worker/profile',
    });
    return { ok: true };
  }

  async listAll() {
    return this.prisma.identityVerification.findMany({
      include: {
        user: {
          select: {
            id: true, email: true, role: true,
            workerProfile: { select: { firstName: true, lastName: true, avatarUrl: true } },
            clientProfile: { select: { firstName: true, lastName: true, avatarUrl: true } },
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });
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

      // Pull the verification report to learn the document type (passport / id_card /
      // driving_license). We deliberately do NOT store PII (name, dob, doc number).
      let documentType: string | null = null;
      try {
        const expanded = await this.stripe.client.identity.verificationSessions.retrieve(
          session.id,
          { expand: ['last_verification_report'] },
        );
        const report = expanded.last_verification_report as Stripe.Identity.VerificationReport | string | null;
        if (report && typeof report !== 'string') {
          documentType = report.document?.type ?? null;
        }
      } catch (err) {
        this.logger.warn(`Could not fetch verification report for ${session.id}: ${(err as Error).message}`);
      }

      await this.prisma.$transaction([
        this.prisma.identityVerification.updateMany({
          where: { stripeSessionId: session.id },
          data: { status: 'VERIFIED', reviewedAt: new Date(), documentType: documentType ?? undefined },
        }),
        this.prisma.user.update({
          where: { id: userId },
          data: { idVerified: true },
        }),
      ]);

      await this.sendVerifiedEmail(userId);
      this.notifications.create({
        userId,
        type: 'ID_VERIFIED',
        title: 'Identity verified',
        body: 'Stripe confirmed your ID. Your profile now shows the verified badge.',
        link: '/worker/profile',
      });
    }

    if (event.type === 'identity.verification_session.requires_input') {
      const session = event.data.object as Stripe.Identity.VerificationSession;
      await this.prisma.identityVerification.updateMany({
        where: { stripeSessionId: session.id },
        data: { status: 'REJECTED', reviewedAt: new Date() },
      });
      const userId = session.metadata?.userId;
      if (userId) {
        this.notifications.create({
          userId,
          type: 'ID_REJECTED',
          title: 'ID verification failed',
          body: 'Stripe couldn’t verify your document. Try again with a clearer photo.',
          link: '/worker/profile',
        });
      }
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
