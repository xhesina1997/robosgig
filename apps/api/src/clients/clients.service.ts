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

    // ASSIGNED jobs whose payment hasn't been funded (no payment row OR PENDING)
    // tell us "amount waiting to be funded".
    const [jobs, payments, escrowedPayments, awaitingJobs] = await Promise.all([
      this.prisma.job.findMany({ where: { clientId: userId }, select: { status: true, createdAt: true } }),
      this.prisma.payment.findMany({
        where: { status: 'COMPLETED', job: { clientId: userId } },
        select: {
          totalAmount: true,
          platformFeeAmount: true,
          createdAt: true,
          job: { select: { category: { select: { name: true } } } },
        },
      }),
      this.prisma.payment.findMany({
        where: { status: 'ESCROWED' as any, job: { clientId: userId } },
        select: { totalAmount: true },
      }),
      this.prisma.job.findMany({
        where: {
          clientId: userId,
          status: 'ASSIGNED',
          OR: [{ payment: { is: null } }, { payment: { is: { status: 'PENDING' } } }],
        },
        select: {
          priceMin: true,
          priceMax: true,
          applications: {
            where: { status: 'ACCEPTED' },
            select: { proposedPrice: true },
            take: 1,
          },
        },
      }),
    ]);

    const totalSpent = payments.reduce((s, p) => s + p.totalAmount, 0);
    const totalFeesPaid = payments.reduce((s, p) => s + p.platformFeeAmount, 0);
    const inEscrow = escrowedPayments.reduce((s, p) => s + p.totalAmount, 0);

    // Awaiting funding = sum of accepted-bid prices on ASSIGNED-but-unfunded jobs
    const awaitingFunding = awaitingJobs.reduce((s, j) => {
      const price = j.applications[0]?.proposedPrice ?? j.priceMax ?? j.priceMin ?? 0;
      return s + price;
    }, 0);

    // This calendar month spend
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonth = payments
      .filter((p) => new Date(p.createdAt) >= monthStart)
      .reduce((s, p) => s + p.totalAmount, 0);

    // Last 6 months spend (oldest → newest) for the sparkline
    const byMonth: Array<{ key: string; label: string; amount: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const next = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const sum = payments
        .filter((p) => new Date(p.createdAt) >= d && new Date(p.createdAt) < next)
        .reduce((s, p) => s + p.totalAmount, 0);
      byMonth.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: d.toLocaleString('en-US', { month: 'short' }),
        amount: Math.round(sum * 100) / 100,
      });
    }

    // Category breakdown for the split bar (top 3 categories + Other)
    const catMap = new Map<string, number>();
    for (const p of payments) {
      const name = p.job?.category?.name ?? 'Other';
      catMap.set(name, (catMap.get(name) ?? 0) + p.totalAmount);
    }
    const catEntries = Array.from(catMap.entries()).sort((a, b) => b[1] - a[1]);
    const top = catEntries.slice(0, 3);
    const otherSum = catEntries.slice(3).reduce((s, [, v]) => s + v, 0);
    const byCategory = totalSpent > 0
      ? [
          ...top.map(([name, amount]) => ({ name, amount, pct: Math.round((amount / totalSpent) * 100) })),
          ...(otherSum > 0 ? [{ name: 'Other', amount: otherSum, pct: Math.round((otherSum / totalSpent) * 100) }] : []),
        ]
      : [];

    return {
      totalSpent,
      totalFeesPaid,
      inEscrow,
      awaitingFunding,
      thisMonth,
      byMonth,
      byCategory,
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
