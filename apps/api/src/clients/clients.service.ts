import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        idVerified: true,
        clientProfile: true,
      },
    });
    if (!user?.clientProfile) throw new NotFoundException('Client profile not found');
    return { ...user.clientProfile, email: user.email, idVerified: user.idVerified };
  }

  async getStats(userId: string) {
    const profile = await this.prisma.clientProfile.findUnique({ where: { userId }, select: { id: true } });
    if (!profile) throw new NotFoundException('Client profile not found');

    const [jobs, payments, escrowedPayments] = await Promise.all([
      this.prisma.job.findMany({ where: { clientId: userId }, select: { status: true, createdAt: true } }),
      this.prisma.payment.findMany({
        where: { status: 'COMPLETED', job: { clientId: userId } },
        select: { totalAmount: true, platformFeeAmount: true, createdAt: true },
      }),
      this.prisma.payment.findMany({
        where: { status: 'ESCROWED' as any, job: { clientId: userId } },
        select: { totalAmount: true },
      }),
    ]);

    const totalSpent = payments.reduce((s, p) => s + p.totalAmount, 0);
    const totalFeesPaid = payments.reduce((s, p) => s + p.platformFeeAmount, 0);
    const inEscrow = escrowedPayments.reduce((s, p) => s + p.totalAmount, 0);

    return {
      totalSpent,
      totalFeesPaid,
      inEscrow,
      jobsPosted: jobs.length,
      jobsCompleted: jobs.filter(j => j.status === 'COMPLETED').length,
      jobsActive: jobs.filter(j => ['ASSIGNED', 'IN_PROGRESS'].includes(j.status)).length,
      memberSince: jobs.length ? jobs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0].createdAt : null,
    };
  }

  async getTransactions(userId: string) {
    const payments = await this.prisma.payment.findMany({
      where: { job: { clientId: userId } },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        totalAmount: true,
        platformFeeAmount: true,
        workerPayout: true,
        status: true,
        createdAt: true,
        job: {
          select: {
            title: true,
            category: { select: { name: true } },
            applications: {
              where: { status: 'ACCEPTED' },
              select: { worker: { select: { firstName: true, lastName: true } } },
              take: 1,
            },
          },
        },
      },
    });

    return payments.map((p) => ({
      id: p.id,
      date: p.createdAt,
      jobTitle: p.job.title,
      category: p.job.category?.name ?? '',
      worker: p.job.applications[0]
        ? `${p.job.applications[0].worker.firstName} ${p.job.applications[0].worker.lastName}`
        : '',
      totalAmount: p.totalAmount,
      platformFee: p.platformFeeAmount,
      workerPayout: p.workerPayout,
      status: p.status,
    }));
  }

  async updateProfile(userId: string, dto: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    city?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
  }) {
    const profile = await this.prisma.clientProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Client profile not found');
    return this.prisma.clientProfile.update({ where: { userId }, data: dto });
  }
}
