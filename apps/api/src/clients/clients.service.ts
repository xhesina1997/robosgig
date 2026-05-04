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
