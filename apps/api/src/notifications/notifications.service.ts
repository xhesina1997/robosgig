import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType } from '@prisma/client';

const APP_URL = (process.env['APP_FRONTEND_URL'] ?? 'http://localhost:4200').replace(/\/$/, '');

/** Events for which we ALSO send an email — keep this list short to avoid spam. */
const EMAIL_TYPES = new Set<NotificationType>([
  NotificationType.APPLICATION_NEW,
  NotificationType.APPLICATION_ACCEPTED,
  NotificationType.APPLICATION_REJECTED,
  NotificationType.PAYMENT_RELEASED,
  NotificationType.JOB_COMPLETED,
  NotificationType.ID_VERIFIED,
  NotificationType.ID_REJECTED,
]);

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly resend: Resend;
  private readonly fromAddress: string;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.resend = new Resend(this.config.get<string>('RESEND_API_KEY') ?? 'placeholder');
    this.fromAddress = this.config.get<string>('RESEND_FROM') ?? 'RobosGig <noreply@robosgig.com>';
  }

  /**
   * Create a notification row and (optionally) send an email. Fire-and-forget —
   * we never throw if email fails; the in-app notification is still saved.
   */
  async create(params: {
    userId: string;
    type: NotificationType;
    title: string;
    body?: string | null;
    link?: string | null;
    email?: boolean;
  }) {
    const notif = await this.prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        body: params.body ?? null,
        link: params.link ?? null,
      },
    });

    const shouldEmail = params.email ?? EMAIL_TYPES.has(params.type);
    if (shouldEmail) {
      // Don't await — send in background so callers aren't blocked.
      this.sendEmail(params.userId, params.title, params.body ?? '', params.link ?? null)
        .catch((err) => this.logger.warn(`Email send failed: ${(err as Error).message}`));
    }

    return notif;
  }

  async list(userId: string, take = 30) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take,
    });
  }

  async unreadCount(userId: string) {
    return this.prisma.notification.count({ where: { userId, read: false } });
  }

  async markRead(userId: string, id: string) {
    await this.prisma.notification.updateMany({
      where: { id, userId },
      data: { read: true },
    });
    return { ok: true };
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
    return { ok: true };
  }

  private async sendEmail(userId: string, subject: string, body: string, link: string | null) {
    const stripeKey = this.config.get<string>('RESEND_API_KEY') ?? '';
    if (!stripeKey || stripeKey.includes('placeholder')) return;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        workerProfile: { select: { firstName: true } },
        clientProfile: { select: { firstName: true } },
      },
    });
    if (!user?.email) return;

    const firstName = user.workerProfile?.firstName ?? user.clientProfile?.firstName ?? 'there';
    const cta = link
      ? `<a href="${APP_URL}${link}" style="display:inline-block;margin-top:18px;background:#0A0A0A;color:#fff;text-decoration:none;padding:10px 22px;border-radius:10px;font-weight:500;font-size:13px">Open RobosGig →</a>`
      : '';

    await this.resend.emails.send({
      from: this.fromAddress,
      to: user.email,
      subject: subject,
      html: `
        <div style="font-family:-apple-system,Geist,Inter,sans-serif;max-width:480px;margin:0 auto;padding:28px 24px;color:#0A0A0A">
          <img src="https://robosgig.com/logo.svg" width="32" height="32" alt="RobosGig" style="margin-bottom:20px"/>
          <p style="margin:0 0 6px;font-size:13px;color:#737373">Hi ${firstName},</p>
          <h2 style="margin:0 0 10px;font-size:18px;letter-spacing:-0.015em">${subject}</h2>
          ${body ? `<p style="color:#404040;line-height:1.55;margin:0;font-size:13.5px">${body}</p>` : ''}
          ${cta}
          <p style="margin-top:28px;color:#A3A3A3;font-size:11px">RobosGig · Vienna, Austria</p>
        </div>
      `,
    });
  }
}
