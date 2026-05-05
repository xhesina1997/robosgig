import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend;
  private readonly from: string;
  private readonly appUrl: string;

  constructor(private config: ConfigService) {
    this.resend = new Resend(config.get<string>('RESEND_API_KEY') ?? 'placeholder');
    this.from = config.get<string>('RESEND_FROM') ?? 'RobosGig <noreply@robosgig.com>';
    this.appUrl = config.get<string>('APP_URL') ?? 'https://app.robosgig.com';
  }

  async sendApplicationReceived(opts: {
    clientEmail: string;
    clientName: string;
    jobTitle: string;
    workerName: string;
    jobId: string;
  }) {
    try {
      await this.resend.emails.send({
        from: this.from,
        to: opts.clientEmail,
        subject: `New application for "${opts.jobTitle}"`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
            <h2 style="margin:0 0 12px;font-size:20px;color:#18181b">Hi ${opts.clientName}, you have a new applicant!</h2>
            <p style="color:#52525b;line-height:1.6;margin:0 0 8px">
              <strong>${opts.workerName}</strong> has applied to your job:
            </p>
            <div style="background:#f4f4f5;border-radius:10px;padding:14px 16px;margin:0 0 24px">
              <p style="margin:0;font-weight:600;color:#18181b">${opts.jobTitle}</p>
            </div>
            <a href="${this.appUrl}/client/dashboard"
               style="display:inline-block;background:#18181b;color:#fff;text-decoration:none;padding:12px 24px;border-radius:99px;font-weight:600;font-size:14px">
              Review application
            </a>
            <p style="color:#a1a1aa;font-size:12px;margin-top:32px">RobosGig · Vienna, Austria</p>
          </div>
        `,
      });
    } catch (err) {
      this.logger.error('Failed to send application received email', err);
    }
  }

  async sendApplicationAccepted(opts: {
    workerEmail: string;
    workerName: string;
    jobTitle: string;
    clientName: string;
  }) {
    try {
      await this.resend.emails.send({
        from: this.from,
        to: opts.workerEmail,
        subject: `Your application was accepted — "${opts.jobTitle}"`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
            <h2 style="margin:0 0 12px;font-size:20px;color:#18181b">Congratulations ${opts.workerName}! 🎉</h2>
            <p style="color:#52525b;line-height:1.6;margin:0 0 8px">
              <strong>${opts.clientName}</strong> has accepted your application for:
            </p>
            <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px 16px;margin:0 0 24px">
              <p style="margin:0;font-weight:600;color:#18181b">${opts.jobTitle}</p>
            </div>
            <p style="color:#52525b;line-height:1.6;margin:0 0 24px">
              Head to your dashboard to view the job details and get started.
            </p>
            <a href="${this.appUrl}/worker/jobs"
               style="display:inline-block;background:#18181b;color:#fff;text-decoration:none;padding:12px 24px;border-radius:99px;font-weight:600;font-size:14px">
              View job
            </a>
            <p style="color:#a1a1aa;font-size:12px;margin-top:32px">RobosGig · Vienna, Austria</p>
          </div>
        `,
      });
    } catch (err) {
      this.logger.error('Failed to send application accepted email', err);
    }
  }

  async sendEmailVerification(opts: {
    email: string;
    name: string;
    code: string;
  }) {
    try {
      await this.resend.emails.send({
        from: this.from,
        to: opts.email,
        subject: `Your RobosGig verification code: ${opts.code}`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
            <h2 style="margin:0 0 12px;font-size:20px;color:#18181b">Verify your email, ${opts.name}</h2>
            <p style="color:#52525b;line-height:1.6;margin:0 0 24px">
              Enter this code to verify your email address. It expires in 15 minutes.
            </p>
            <div style="background:#f4f4f5;border-radius:12px;padding:20px;text-align:center;margin:0 0 24px">
              <span style="font-size:32px;font-weight:800;letter-spacing:0.15em;color:#18181b">${opts.code}</span>
            </div>
            <p style="color:#a1a1aa;font-size:13px;margin:0">
              If you didn't create a RobosGig account, you can safely ignore this email.
            </p>
            <p style="color:#a1a1aa;font-size:12px;margin-top:32px">RobosGig · Vienna, Austria</p>
          </div>
        `,
      });
    } catch (err) {
      this.logger.error('Failed to send email verification', err);
    }
  }
}
