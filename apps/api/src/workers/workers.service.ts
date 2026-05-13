import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { StripeService } from '../stripe/stripe.service';

@Injectable()
export class WorkersService {
  constructor(
    private prisma: PrismaService,
    private ai: AiService,
    private stripe: StripeService,
    private config: ConfigService,
  ) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        workerProfile: { include: { skills: { include: { skill: { include: { category: true } } } } } },
      },
    });
    if (!user?.workerProfile) throw new NotFoundException('Worker profile not found');
    return { ...user.workerProfile, email: user.email };
  }

  async updateProfile(userId: string, dto: {
    firstName?: string;
    lastName?: string;
    bio?: string;
    phone?: string;
    hourlyRate?: number;
    city?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    isAvailable?: boolean;
    dateOfBirth?: string;
    profession?: string;
    customSkills?: string[];
    bankAccountName?: string;
    bankIban?: string;
    bankBic?: string;
    paypalEmail?: string;
    revolutContact?: string;
  }) {
    const profile = await this.prisma.workerProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Worker profile not found');

    const data = {
      ...dto,
      ...(dto.dateOfBirth ? { dateOfBirth: new Date(dto.dateOfBirth) } : {}),
    };

    return this.prisma.workerProfile.update({
      where: { userId },
      data,
      include: {
        skills: { include: { skill: { include: { category: true } } } },
      },
    });
  }

  async addSkill(userId: string, skillId: string) {
    const profile = await this.prisma.workerProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Worker profile not found');

    const skill = await this.prisma.skill.findUnique({ where: { id: skillId } });
    if (!skill) throw new NotFoundException('Skill not found');

    return this.prisma.workerSkill.upsert({
      where: { workerId_skillId: { workerId: profile.id, skillId } },
      update: {},
      create: { workerId: profile.id, skillId },
    });
  }

  async removeSkill(userId: string, skillId: string) {
    const profile = await this.prisma.workerProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Worker profile not found');

    await this.prisma.workerSkill.delete({
      where: { workerId_skillId: { workerId: profile.id, skillId } },
    });
  }

  async getStats(userId: string) {
    const profile = await this.prisma.workerProfile.findUnique({
      where: { userId },
      select: { id: true, totalJobs: true, rating: true, totalReviews: true, createdAt: true },
    });
    if (!profile) throw new NotFoundException('Worker profile not found');

    const [completedPayments, escrowedPayments, applications, acceptedUnfunded] = await Promise.all([
      this.prisma.payment.findMany({
        where: { status: 'COMPLETED', job: { applications: { some: { workerId: profile.id, status: 'ACCEPTED' } } } },
        select: {
          workerPayout: true,
          payoutSent: true,
          createdAt: true,
          job: { select: { category: { select: { name: true } } } },
        },
      }),
      this.prisma.payment.findMany({
        where: { status: 'ESCROWED' as any, job: { applications: { some: { workerId: profile.id, status: 'ACCEPTED' } } } },
        select: { workerPayout: true },
      }),
      this.prisma.jobApplication.findMany({
        where: { workerId: profile.id },
        select: { status: true },
      }),
      // Accepted applications on jobs that the client hasn't funded escrow yet —
      // worker-side equivalent of client's "Awaiting funding". They expect this
      // money once the client pays.
      this.prisma.jobApplication.findMany({
        where: {
          workerId: profile.id,
          status: 'ACCEPTED',
          job: {
            status: { in: ['ASSIGNED', 'IN_PROGRESS'] },
            OR: [{ payment: { is: null } }, { payment: { is: { status: 'PENDING' } } }],
          },
        },
        select: {
          proposedPrice: true,
          job: { select: { priceMin: true, priceMax: true } },
        },
      }),
    ]);

    const totalEarned = completedPayments.reduce((s, p) => s + p.workerPayout, 0);
    const pendingPayout = escrowedPayments.reduce((s, p) => s + p.workerPayout, 0);

    // Awaiting client funding: sum of expected payouts for assigned-but-unfunded jobs.
    const awaitingPayout = acceptedUnfunded.reduce((s, a) => {
      const price = a.proposedPrice ?? a.job?.priceMax ?? a.job?.priceMin ?? 0;
      return s + price;
    }, 0);
    const awaitingPayoutCount = acceptedUnfunded.length;

    // This calendar month earned
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonth = completedPayments
      .filter((p) => new Date(p.createdAt) >= monthStart)
      .reduce((s, p) => s + p.workerPayout, 0);

    // Last 6 months for sparkline (oldest → newest)
    const byMonth: Array<{ key: string; label: string; amount: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const next = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const sum = completedPayments
        .filter((p) => new Date(p.createdAt) >= d && new Date(p.createdAt) < next)
        .reduce((s, p) => s + p.workerPayout, 0);
      byMonth.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: d.toLocaleString('en-US', { month: 'short' }),
        amount: Math.round(sum * 100) / 100,
      });
    }

    // Category breakdown (top 3 + Other) for the split bar
    const catMap = new Map<string, number>();
    for (const p of completedPayments) {
      const name = p.job?.category?.name ?? 'Other';
      catMap.set(name, (catMap.get(name) ?? 0) + p.workerPayout);
    }
    const catEntries = Array.from(catMap.entries()).sort((a, b) => b[1] - a[1]);
    const top = catEntries.slice(0, 3);
    const otherSum = catEntries.slice(3).reduce((s, [, v]) => s + v, 0);
    const byCategory = totalEarned > 0
      ? [
          ...top.map(([name, amount]) => ({ name, amount, pct: Math.round((amount / totalEarned) * 100) })),
          ...(otherSum > 0 ? [{ name: 'Other', amount: otherSum, pct: Math.round((otherSum / totalEarned) * 100) }] : []),
        ]
      : [];

    return {
      totalEarned,
      pendingPayout,
      awaitingPayout,
      awaitingPayoutCount,
      thisMonth,
      byMonth,
      byCategory,
      jobsCompleted: profile.totalJobs,
      rating: profile.rating,
      totalReviews: profile.totalReviews,
      totalApplications: applications.length,
      acceptanceRate: applications.length
        ? Math.round((applications.filter(a => a.status === 'ACCEPTED').length / applications.length) * 100)
        : 0,
      memberSince: profile.createdAt,
    };
  }

  async getNearbyJobs(userId: string, skip = 0, take = 10) {
    const profile = await this.prisma.workerProfile.findUnique({
      where: { userId },
      include: { skills: { include: { skill: true } } },
    });
    if (!profile) throw new NotFoundException('Worker profile not found');

    const [jobs, total] = await Promise.all([
      this.prisma.job.findMany({
        where: { status: 'POSTED' },
        include: {
          category: true,
          client: {
            include: {
              clientProfile: { select: { firstName: true, lastName: true } },
            },
          },
          applications: {
            where: { workerId: profile.id },
            select: { status: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.job.count({ where: { status: 'POSTED' } }),
    ]);

    return {
      total,
      jobs: jobs.map((job) => ({
        ...job,
        distanceKm: job.latitude && job.longitude
          ? Math.round(distanceKm(profile.latitude, profile.longitude, job.latitude, job.longitude) * 10) / 10
          : null,
        alreadyApplied: job.applications.length > 0,
        applicationStatus: job.applications[0]?.status ?? null,
      })),
    };
  }

  async getJobsForMap(userId: string) {
    const profile = await this.prisma.workerProfile.findUnique({
      where: { userId },
    });
    if (!profile) throw new NotFoundException('Worker profile not found');

    const jobs = await this.prisma.job.findMany({
      where: { status: 'POSTED' },
      include: {
        category: true,
        client: {
          include: { clientProfile: { select: { firstName: true, lastName: true } } },
        },
        applications: { where: { workerId: profile.id }, select: { status: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 300,
    });

    return {
      workerLocation: { lat: profile.latitude, lng: profile.longitude },
      jobs: jobs.map((job) => ({
        ...job,
        distanceKm: job.latitude && job.longitude
          ? Math.round(distanceKm(profile.latitude, profile.longitude, job.latitude, job.longitude) * 10) / 10
          : null,
        alreadyApplied: job.applications.length > 0,
        applicationStatus: job.applications[0]?.status ?? null,
      })),
    };
  }

  async getJobDetail(userId: string, jobId: string) {
    const profile = await this.prisma.workerProfile.findUnique({ where: { userId } });
    if (!profile) throw new NotFoundException('Worker profile not found');

    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: {
        category: true,
        client: {
          select: {
            idVerified: true,
            clientProfile: { select: { firstName: true, lastName: true } },
          },
        },
        applications: {
          where: { workerId: profile.id },
          select: { id: true, status: true, proposedPrice: true, message: true, createdAt: true },
        },
        _count: { select: { applications: true } },
      },
    });

    if (!job) throw new NotFoundException('Job not found');

    const myApp = job.applications[0] ?? null;
    return {
      ...job,
      distanceKm: job.latitude && job.longitude
        ? Math.round(distanceKm(profile.latitude, profile.longitude, job.latitude, job.longitude) * 10) / 10
        : null,
      alreadyApplied: !!myApp,
      applicationStatus: myApp?.status ?? null,
      myApplication: myApp,
      applicationCount: job._count.applications,
    };
  }

  async parseAiMapFilter(_userId: string, query: string) {
    const categories = await this.prisma.category.findMany({ select: { name: true } });
    return this.ai.parseMapFilters(query, categories.map((c) => c.name));
  }

  async getAllSkills() {
    return this.prisma.skill.findMany({
      include: { category: true },
      orderBy: [{ category: { name: 'asc' } }, { name: 'asc' }],
    });
  }

  async getPublicProfile(workerId: string) {
    const profile = await this.prisma.workerProfile.findUnique({
      where: { id: workerId },
      include: {
        skills: { include: { skill: { include: { category: true } } } },
        reviews: {
          include: {
            job: { select: { title: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });
    if (!profile) throw new NotFoundException('Worker not found');
    return profile;
  }

  // ── Stripe Connect ────────────────────────────────────────────────

  async getConnectStatus(userId: string) {
    const profile = await this.prisma.workerProfile.findUnique({
      where: { userId },
      select: { stripeConnectId: true, stripeConnectOnboarded: true },
    });
    if (!profile) throw new NotFoundException('Worker profile not found');

    if (!profile.stripeConnectId) {
      return { connected: false, onboarded: false, payoutsEnabled: false };
    }

    try {
      const account = await this.stripe.retrieveConnectAccount(profile.stripeConnectId);
      const onboarded = account.details_submitted && (account.payouts_enabled ?? false);
      if (onboarded && !profile.stripeConnectOnboarded) {
        await this.prisma.workerProfile.update({
          where: { userId },
          data: { stripeConnectOnboarded: true },
        });
      }
      return {
        connected: true,
        onboarded: account.details_submitted,
        payoutsEnabled: account.payouts_enabled ?? false,
      };
    } catch {
      return { connected: true, onboarded: false, payoutsEnabled: false };
    }
  }

  async initiateConnectOnboarding(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, workerProfile: { select: { stripeConnectId: true } } },
    });
    if (!user?.workerProfile) throw new NotFoundException('Worker profile not found');

    let connectId = user.workerProfile.stripeConnectId;
    if (!connectId) {
      const account = await this.stripe.createConnectAccount(user.email);
      connectId = account.id;
      await this.prisma.workerProfile.update({
        where: { userId },
        data: { stripeConnectId: connectId },
      });
    }

    const frontendUrl = this.config.get<string>('APP_FRONTEND_URL') ?? 'http://localhost:4200';
    const link = await this.stripe.createAccountLink(
      connectId,
      `${frontendUrl}/worker/profile?connect=refresh`,
      `${frontendUrl}/worker/profile?connect=success`,
    );
    return { url: link.url };
  }

  async getConnectDashboardLink(userId: string) {
    const profile = await this.prisma.workerProfile.findUnique({
      where: { userId },
      select: { stripeConnectId: true, stripeConnectOnboarded: true },
    });
    if (!profile?.stripeConnectId) throw new BadRequestException('No Stripe account connected');
    if (!profile.stripeConnectOnboarded) throw new BadRequestException('Stripe onboarding not complete');

    const link = await this.stripe.createLoginLink(profile.stripeConnectId);
    return { url: link.url };
  }

  async getSavedJobs(userId: string) {
    const profile = await this.prisma.workerProfile.findUnique({ where: { userId }, select: { id: true } });
    if (!profile) throw new NotFoundException('Worker profile not found');
    return this.prisma.savedJob.findMany({
      where: { workerId: profile.id },
      include: {
        job: {
          include: {
            category: true,
            client: { select: { clientProfile: { select: { firstName: true, lastName: true } } } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async saveJob(userId: string, jobId: string) {
    const profile = await this.prisma.workerProfile.findUnique({ where: { userId }, select: { id: true } });
    if (!profile) throw new NotFoundException('Worker profile not found');
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Job not found');
    return this.prisma.savedJob.upsert({
      where: { workerId_jobId: { workerId: profile.id, jobId } },
      create: { workerId: profile.id, jobId },
      update: {},
    });
  }

  async unsaveJob(userId: string, jobId: string) {
    const profile = await this.prisma.workerProfile.findUnique({ where: { userId }, select: { id: true } });
    if (!profile) throw new NotFoundException('Worker profile not found');
    await this.prisma.savedJob.deleteMany({ where: { workerId: profile.id, jobId } });
    return { success: true };
  }
}

function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
