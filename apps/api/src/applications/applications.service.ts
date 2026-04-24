import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ApplicationsService {
  constructor(private prisma: PrismaService) {}

  async apply(userId: string, jobId: string, dto: { proposedPrice?: number; message?: string }) {
    const workerProfile = await this.prisma.workerProfile.findUnique({
      where: { userId },
      include: { user: { select: { idVerified: true } } },
    });
    if (!workerProfile) throw new ForbiddenException('Only workers can apply to jobs');
    if (!workerProfile.user.idVerified) {
      throw new ForbiddenException('You must verify your identity before applying to jobs');
    }

    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Job not found');
    if (job.status !== 'POSTED') throw new BadRequestException('This job is no longer accepting applications');

    const existing = await this.prisma.jobApplication.findUnique({
      where: { jobId_workerId: { jobId, workerId: workerProfile.id } },
    });
    if (existing) throw new BadRequestException('You have already applied to this job');

    return this.prisma.jobApplication.create({
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
      include: { job: true },
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
      include: { job: true },
    });
    if (!application) throw new NotFoundException('Application not found');
    if (application.job.clientId !== userId) throw new ForbiddenException('Not your job');

    return this.prisma.jobApplication.update({
      where: { id: applicationId },
      data: { status: 'REJECTED' },
    });
  }

  async completeJob(userId: string, jobId: string) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: {
        applications: { where: { status: 'ACCEPTED' } },
      },
    });
    if (!job) throw new NotFoundException('Job not found');
    if (job.clientId !== userId) throw new ForbiddenException('Not your job');

    const acceptedApp = job.applications[0];
    const totalAmount = acceptedApp?.proposedPrice ?? job.priceMax ?? job.priceMin ?? 0;

    if (totalAmount > 0) {
      // Fetch subscriptions to determine platform fee rate
      const [workerSub, clientSub] = await Promise.all([
        acceptedApp
          ? this.prisma.subscription.findUnique({
              where: { userId: (await this.prisma.workerProfile.findUnique({ where: { id: acceptedApp.workerId }, select: { userId: true } }))!.userId },
            })
          : Promise.resolve(null),
        this.prisma.subscription.findUnique({ where: { userId: job.clientId } }),
      ]);

      // Worker PRO: 12% fee, Client BUSINESS: 10% fee, default: 15%
      let feePercent = 15;
      if (workerSub?.isActive && workerSub.planType === 'WORKER_PRO') feePercent = 12;
      else if (clientSub?.isActive && clientSub.planType === 'CLIENT_BUSINESS') feePercent = 10;

      const platformFeeAmount = Math.round(totalAmount * feePercent) / 100;
      const workerPayout = totalAmount - platformFeeAmount;

      await this.prisma.payment.upsert({
        where: { jobId },
        create: { jobId, totalAmount, platformFeePercent: feePercent, platformFeeAmount, workerPayout, status: 'COMPLETED' },
        update: { totalAmount, platformFeePercent: feePercent, platformFeeAmount, workerPayout, status: 'COMPLETED' },
      });
    }

    if (acceptedApp) {
      await this.prisma.workerProfile.update({
        where: { id: acceptedApp.workerId },
        data: { totalJobs: { increment: 1 } },
      });
    }

    return this.prisma.job.update({
      where: { id: jobId },
      data: { status: 'COMPLETED' },
    });
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
