import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { StripeService } from '../stripe/stripe.service';
import { RevolutService } from '../revolut/revolut.service';
import { EmailService } from '../email/email.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ApplicationsService {
  constructor(
    private prisma: PrismaService,
    private stripe: StripeService,
    private revolut: RevolutService,
    private config: ConfigService,
    private email: EmailService,
    private notifications: NotificationsService,
  ) {}

  async apply(userId: string, jobId: string, dto: { proposedPrice?: number; message?: string }) {
    const workerProfile = await this.prisma.workerProfile.findUnique({
      where: { userId },
      include: { user: { select: { idVerified: true } } },
    });
    if (!workerProfile) throw new ForbiddenException('Only workers can apply to jobs');
    if (!workerProfile.user.idVerified) {
      throw new ForbiddenException('You must verify your identity before applying to jobs');
    }

    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: {
        client: {
          select: {
            email: true,
            clientProfile: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });
    if (!job) throw new NotFoundException('Job not found');
    if (job.status !== 'POSTED') throw new BadRequestException('This job is no longer accepting applications');

    const existing = await this.prisma.jobApplication.findUnique({
      where: { jobId_workerId: { jobId, workerId: workerProfile.id } },
    });
    if (existing) throw new BadRequestException('You have already applied to this job');

    const application = await this.prisma.jobApplication.create({
      data: {
        jobId,
        workerId: workerProfile.id,
        status: 'APPLIED',
        proposedPrice: dto.proposedPrice,
        message: dto.message,
      },
      include: {
        worker: { select: { firstName: true, lastName: true, rating: true, avatarUrl: true } },
        job: { select: { title: true } },
      },
    });

    // Notify client by email
    const clientProfile = job.client.clientProfile;
    if (clientProfile) {
      this.email.sendApplicationReceived({
        clientEmail: job.client.email,
        clientName: clientProfile.firstName,
        jobTitle: job.title,
        workerName: `${workerProfile.firstName} ${workerProfile.lastName}`,
        jobId: job.id,
      });
    }

    // In-app notification for the client (email already handled above; skip duplicate)
    this.notifications.create({
      userId: job.clientId,
      type: 'APPLICATION_NEW',
      title: 'New application',
      body: `${workerProfile.firstName} ${workerProfile.lastName} applied to "${job.title}".`,
      link: `/dashboard/client`,
      email: false,
    });

    return application;
  }

  async getJobApplications(userId: string, jobId: string) {
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Job not found');
    if (job.clientId !== userId) throw new ForbiddenException('Not your job');

    return this.prisma.jobApplication.findMany({
      where: { jobId },
      include: {
        worker: {
          include: {
            skills: { include: { skill: { include: { category: true } } } },
          },
        },
      },
      orderBy: [{ matchScore: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async acceptApplication(userId: string, applicationId: string) {
    const application = await this.prisma.jobApplication.findUnique({
      where: { id: applicationId },
      include: {
        job: true,
        worker: {
          include: { user: { select: { email: true } } },
        },
      },
    });
    if (!application) throw new NotFoundException('Application not found');
    if (application.job.clientId !== userId) throw new ForbiddenException('Not your job');

    // Accept this application, reject others
    await this.prisma.jobApplication.updateMany({
      where: { jobId: application.jobId, id: { not: applicationId } },
      data: { status: 'REJECTED' },
    });

    const updated = await this.prisma.jobApplication.update({
      where: { id: applicationId },
      data: { status: 'ACCEPTED' },
    });

    // Update job status to ASSIGNED
    await this.prisma.job.update({
      where: { id: application.jobId },
      data: { status: 'ASSIGNED' },
    });

    // Notify worker by email
    const client = await this.prisma.clientProfile.findUnique({
      where: { userId },
      select: { firstName: true, lastName: true },
    });
    this.email.sendApplicationAccepted({
      workerEmail: (application.worker as any).user.email,
      workerName: application.worker.firstName,
      jobTitle: application.job.title,
      clientName: client ? `${client.firstName} ${client.lastName}` : 'A client',
    });

    // In-app: notify the accepted worker
    this.notifications.create({
      userId: (application.worker as any).userId,
      type: 'APPLICATION_ACCEPTED',
      title: 'You got hired',
      body: `Your application for "${application.job.title}" was accepted${client ? ' by ' + client.firstName : ''}.`,
      link: '/dashboard/worker',
      email: false,
    });

    // Also notify the other (rejected) applicants
    const rejected = await this.prisma.jobApplication.findMany({
      where: { jobId: application.jobId, id: { not: applicationId }, status: 'REJECTED' },
      select: { worker: { select: { userId: true } } },
    });
    for (const r of rejected) {
      this.notifications.create({
        userId: (r.worker as any).userId,
        type: 'APPLICATION_REJECTED',
        title: 'Application not selected',
        body: `The client chose another worker for "${application.job.title}". Browse new jobs nearby.`,
        link: '/worker/jobs',
      });
    }

    return updated;
  }

  async workerWithdrawApplication(userId: string, applicationId: string) {
    const workerProfile = await this.prisma.workerProfile.findUnique({ where: { userId } });
    if (!workerProfile) throw new ForbiddenException('Worker profile not found');

    const application = await this.prisma.jobApplication.findUnique({
      where: { id: applicationId },
    });
    if (!application) throw new NotFoundException('Application not found');
    if (application.workerId !== workerProfile.id) throw new ForbiddenException('Not your application');
    if (!['APPLIED', 'NOTIFIED'].includes(application.status)) {
      throw new BadRequestException('This application cannot be withdrawn');
    }

    return this.prisma.jobApplication.update({
      where: { id: applicationId },
      data: { status: 'WITHDRAWN' as any },
    });
  }

  async workerAcceptAssignment(userId: string, applicationId: string) {
    const workerProfile = await this.prisma.workerProfile.findUnique({ where: { userId } });
    if (!workerProfile) throw new ForbiddenException('Worker profile not found');

    const application = await this.prisma.jobApplication.findUnique({
      where: { id: applicationId },
      include: { job: true },
    });
    if (!application) throw new NotFoundException('Application not found');
    if (application.workerId !== workerProfile.id) throw new ForbiddenException('Not your application');
    if (application.status !== 'NOTIFIED') throw new BadRequestException('This assignment cannot be accepted');

    const updated = await this.prisma.jobApplication.update({
      where: { id: applicationId },
      data: { status: 'ACCEPTED' },
    });

    await this.prisma.job.update({
      where: { id: application.jobId },
      data: { status: 'ASSIGNED' },
    });

    return updated;
  }

  async workerDeclineAssignment(userId: string, applicationId: string) {
    const workerProfile = await this.prisma.workerProfile.findUnique({ where: { userId } });
    if (!workerProfile) throw new ForbiddenException('Worker profile not found');

    const application = await this.prisma.jobApplication.findUnique({
      where: { id: applicationId },
      include: { job: true },
    });
    if (!application) throw new NotFoundException('Application not found');
    if (application.workerId !== workerProfile.id) throw new ForbiddenException('Not your application');
    if (application.status !== 'NOTIFIED') throw new BadRequestException('This assignment cannot be declined');

    return this.prisma.jobApplication.update({
      where: { id: applicationId },
      data: { status: 'REJECTED' },
    });
  }

  async rejectApplication(userId: string, applicationId: string) {
    const application = await this.prisma.jobApplication.findUnique({
      where: { id: applicationId },
      include: { job: true, worker: { select: { userId: true } } },
    });
    if (!application) throw new NotFoundException('Application not found');
    if (application.job.clientId !== userId) throw new ForbiddenException('Not your job');

    const updated = await this.prisma.jobApplication.update({
      where: { id: applicationId },
      data: { status: 'REJECTED' },
    });

    this.notifications.create({
      userId: (application.worker as any).userId,
      type: 'APPLICATION_REJECTED',
      title: 'Application declined',
      body: `The client declined your application for "${application.job.title}".`,
      link: '/worker/jobs',
    });

    return updated;
  }

  async completeJob(userId: string, jobId: string) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: {
        applications: {
          where: { status: 'ACCEPTED' },
          include: {
            worker: {
              select: {
                stripeConnectId: true, stripeConnectOnboarded: true,
                firstName: true, lastName: true,
                revolutContact: true, bankIban: true, bankBic: true,
              } as any,
            },
          },
        },
      },
    });
    if (!job) throw new NotFoundException('Job not found');
    if (job.clientId !== userId) throw new ForbiddenException('Not your job');
    if (!['IN_PROGRESS', 'ASSIGNED'].includes(job.status)) {
      throw new BadRequestException('Job cannot be completed at this stage');
    }

    const acceptedApp = job.applications[0];
    const payment = await this.prisma.payment.findUnique({ where: { jobId } });

    if (payment && (payment.status as string) === 'ESCROWED') {
      // Release escrow: mark payment COMPLETED, job COMPLETED, increment worker stats
      await this.prisma.$transaction([
        this.prisma.payment.update({
          where: { jobId },
          data: { status: 'COMPLETED' },
        }),
        this.prisma.job.update({ where: { id: jobId }, data: { status: 'COMPLETED' } }),
        ...(acceptedApp
          ? [this.prisma.workerProfile.update({
              where: { id: acceptedApp.workerId },
              data: { totalJobs: { increment: 1 } },
            })]
          : []),
      ]);

      // Attempt automatic payout — try Stripe Connect, then Revolut, else manual
      const worker = (acceptedApp as any)?.worker;
      const workerPayoutCents = Math.round(payment.workerPayout * 100);
      const stripeKey = this.config.get<string>('STRIPE_SECRET_KEY') ?? '';
      let payoutSent = false;

      if (
        worker?.stripeConnectId && worker?.stripeConnectOnboarded &&
        workerPayoutCents > 0 && stripeKey && !stripeKey.includes('placeholder')
      ) {
        try {
          await this.stripe.createTransfer(workerPayoutCents, 'eur', worker.stripeConnectId, { jobId });
          payoutSent = true;
        } catch { /* fall through to Revolut */ }
      }

      if (!payoutSent && this.revolut.isConfigured() && payment.workerPayout > 0) {
        try {
          await this.revolut.sendPayout({
            requestId: `job-${jobId}`,
            amount: payment.workerPayout,
            currency: 'EUR',
            workerName: worker ? `${worker.firstName} ${worker.lastName}` : 'Worker',
            revolutContact: worker?.revolutContact,
            bankIban: worker?.bankIban,
            bankBic: worker?.bankBic,
            reference: `Job payment ${jobId}`,
          });
          payoutSent = true;
        } catch { /* payout can be sent manually from admin panel */ }
      }

      if (payoutSent) {
        await this.prisma.payment.update({
          where: { jobId },
          data: { payoutSent: true, payoutSentAt: new Date() },
        });
      }
    } else {
      // No escrowed payment (old flow / admin override) — just mark complete
      await this.prisma.job.update({ where: { id: jobId }, data: { status: 'COMPLETED' } });
      if (acceptedApp) {
        await this.prisma.workerProfile.update({
          where: { id: acceptedApp.workerId },
          data: { totalJobs: { increment: 1 } },
        });
      }
    }

    // Notify the worker that the job was marked complete + payout was released
    if (acceptedApp) {
      const workerApp = await this.prisma.jobApplication.findUnique({
        where: { id: acceptedApp.id },
        include: { worker: { select: { userId: true } } },
      });
      const workerUserId = (workerApp?.worker as any)?.userId;
      if (workerUserId) {
        this.notifications.create({
          userId: workerUserId,
          type: 'JOB_COMPLETED',
          title: 'Job marked complete',
          body: `The client closed "${job.title}". Payout has been released.`,
          link: '/dashboard/worker',
        });
      }
    }

    return { jobId, status: 'COMPLETED' };
  }

  async leaveReview(userId: string, jobId: string, dto: { rating: number; comment?: string }) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: {
        applications: { where: { status: 'ACCEPTED' } },
      },
    });
    if (!job) throw new NotFoundException('Job not found');
    if (job.clientId !== userId) throw new ForbiddenException('Not your job');
    if (job.status !== 'COMPLETED') throw new BadRequestException('Job must be completed before reviewing');

    const acceptedApp = job.applications[0];
    if (!acceptedApp) throw new BadRequestException('No accepted worker found');

    const review = await this.prisma.review.upsert({
      where: { jobId_workerId: { jobId, workerId: acceptedApp.workerId } },
      update: { rating: dto.rating, comment: dto.comment },
      create: {
        jobId,
        workerId: acceptedApp.workerId,
        clientId: userId,
        rating: dto.rating,
        comment: dto.comment,
      },
    });

    // Update worker rating average
    const reviews = await this.prisma.review.findMany({ where: { workerId: acceptedApp.workerId } });
    const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    await this.prisma.workerProfile.update({
      where: { id: acceptedApp.workerId },
      data: { rating: Math.round(avg * 10) / 10, totalReviews: reviews.length },
    });

    return review;
  }
}
