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
}
