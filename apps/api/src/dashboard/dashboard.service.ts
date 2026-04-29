import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getClientDashboard(userId: string, skip = 0, take = 10) {
    const [jobs, allJobs, profile] = await Promise.all([
      this.prisma.job.findMany({
        where: { clientId: userId },
        include: {
          category: true,
          applications: {
            include: {
              worker: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatarUrl: true,
                  rating: true,
                  hourlyRate: true,
                  totalJobs: true,
                  user: { select: { idVerified: true } },
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
          payment: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.job.findMany({ where: { clientId: userId }, select: { status: true } }),
      this.prisma.clientProfile.findUnique({ where: { userId } }),
    ]);

    const stats = {
      total: allJobs.length,
      posted: allJobs.filter((j) => j.status === 'POSTED').length,
      inProgress: allJobs.filter((j) => ['ASSIGNED', 'IN_PROGRESS'].includes(j.status)).length,
      completed: allJobs.filter((j) => j.status === 'COMPLETED').length,
    };

    return { profile, jobs, stats, total: allJobs.length };
  }

  async getWorkerDashboard(userId: string, skip = 0, take = 10) {
    const workerProfile = await this.prisma.workerProfile.findUnique({
      where: { userId },
      include: {
        skills: { include: { skill: { include: { category: true } } } },
        reviews: { orderBy: { createdAt: 'desc' }, take: 3 },
      },
    });

    const [applications, allApplications] = await Promise.all([
      this.prisma.jobApplication.findMany({
        where: { workerId: workerProfile?.id },
        include: { job: { include: { category: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.jobApplication.findMany({
        where: { workerId: workerProfile?.id },
        select: { status: true },
      }),
    ]);

    const stats = {
      totalJobs: workerProfile?.totalJobs ?? 0,
      rating: workerProfile?.rating ?? 0,
      totalReviews: workerProfile?.totalReviews ?? 0,
      applied: allApplications.filter((a) => a.status === 'APPLIED').length,
      accepted: allApplications.filter((a) => a.status === 'ACCEPTED').length,
      completed: allApplications.filter((a) => a.status === 'COMPLETED').length,
    };

    return { profile: workerProfile, applications, stats, total: allApplications.length };
  }

  async getAdminDashboard() {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Build 6-month revenue buckets
    const revenueByMonth: { month: string; revenue: number; fees: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const payments = await this.prisma.payment.findMany({
        where: { status: 'COMPLETED', createdAt: { gte: start, lt: end } },
        select: { totalAmount: true, platformFeeAmount: true },
      });
      revenueByMonth.push({
        month: start.toLocaleString('default', { month: 'short', year: '2-digit' }),
        revenue: payments.reduce((s, p) => s + p.totalAmount, 0),
        fees: payments.reduce((s, p) => s + p.platformFeeAmount, 0),
      });
    }

    const [
      totalUsers, newUsersThisMonth, totalWorkers, totalClients,
      totalJobs, jobsThisMonth, completedJobs,
      allPayments, paymentsThisMonth,
      subscriptions,
      openReports,
      recentUsers,
      jobsByStatus,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { createdAt: { gte: thisMonthStart } } }),
      this.prisma.user.count({ where: { role: 'WORKER' } }),
      this.prisma.user.count({ where: { role: 'CLIENT' } }),
      this.prisma.job.count(),
      this.prisma.job.count({ where: { createdAt: { gte: thisMonthStart } } }),
      this.prisma.job.count({ where: { status: 'COMPLETED' } }),
      this.prisma.payment.findMany({ where: { status: 'COMPLETED' }, select: { totalAmount: true, platformFeeAmount: true } }),
      this.prisma.payment.findMany({ where: { status: 'COMPLETED', createdAt: { gte: thisMonthStart } }, select: { totalAmount: true, platformFeeAmount: true } }),
      this.prisma.subscription.findMany({ select: { planType: true, isActive: true } }),
      this.prisma.report.count({ where: { status: 'OPEN' } }),
      this.prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true, email: true, role: true, createdAt: true, idVerified: true,
          workerProfile: { select: { firstName: true, lastName: true, city: true, totalJobs: true, rating: true } },
          clientProfile: { select: { firstName: true, lastName: true, city: true } },
        },
      }),
      this.prisma.job.groupBy({ by: ['status'], _count: { id: true } }),
    ]);

    const totalRevenue = allPayments.reduce((s, p) => s + p.totalAmount, 0);
    const totalFees = allPayments.reduce((s, p) => s + p.platformFeeAmount, 0);
    const revenueThisMonth = paymentsThisMonth.reduce((s, p) => s + p.totalAmount, 0);
    const feesThisMonth = paymentsThisMonth.reduce((s, p) => s + p.platformFeeAmount, 0);

    const activeSubs = subscriptions.filter(s => s.isActive).length;
    const subsByPlan = subscriptions.reduce((acc, s) => {
      acc[s.planType] = (acc[s.planType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const jobStatusMap = jobsByStatus.reduce((acc, j) => {
      acc[j.status] = j._count.id;
      return acc;
    }, {} as Record<string, number>);

    return {
      users: { total: totalUsers, workers: totalWorkers, clients: totalClients, newThisMonth: newUsersThisMonth },
      jobs: { total: totalJobs, newThisMonth: jobsThisMonth, completed: completedJobs, byStatus: jobStatusMap },
      revenue: { total: totalRevenue, fees: totalFees, thisMonth: revenueThisMonth, feesThisMonth, byMonth: revenueByMonth },
      subscriptions: { active: activeSubs, byPlan: subsByPlan },
      reports: { open: openReports },
      recentUsers,
    };
  }
}
