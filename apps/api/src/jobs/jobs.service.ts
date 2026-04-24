import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { AnalyzeJobDto } from './dto/analyze-job.dto';
import { CreateJobDto } from './dto/create-job.dto';

// Simple Haversine distance calculation
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

@Injectable()
export class JobsService {
  constructor(
    private prisma: PrismaService,
    private ai: AiService
  ) {}

  async analyzeAndPreview(dto: AnalyzeJobDto) {
    // 1. Let AI parse the raw input
    const analysis = await this.ai.analyzeJob(dto.rawInput, dto.city || 'Vienna', dto.country || 'Austria');

    // 2. Find nearby workers with relevant category
    const category = await this.prisma.category.findUnique({
      where: { slug: analysis.categorySlug },
    });

    const workers = await this.prisma.workerProfile.findMany({
      where: {
        isAvailable: true,
        ...(category
          ? {
              skills: {
                some: { skill: { categoryId: category.id } },
              },
            }
          : {}),
      },
      include: {
        skills: { include: { skill: { include: { category: true } } } },
        user: { select: { email: true } },
      },
      take: 20, // limit candidates before AI scoring
    });

    // 3. Calculate distance and prepare worker data for AI scoring
    const clientLat = dto.latitude ?? 48.2082; // Vienna center as fallback
    const clientLon = dto.longitude ?? 16.3738;

    const workerData = workers.map((w) => ({
      id: w.id,
      skills: w.skills.map((ws) => ws.skill.name),
      rating: w.rating,
      totalJobs: w.totalJobs,
      hourlyRate: w.hourlyRate,
      distanceKm: distanceKm(clientLat, clientLon, w.latitude, w.longitude),
      isAvailable: w.isAvailable,
    }));

    // 4. AI scores and ranks workers
    const scores = await this.ai.scoreWorkers(analysis, workerData);

    // 5. Merge scores back with worker profiles
    const rankedWorkers = scores
      .map((score) => {
        const worker = workers.find((w) => w.id === score.workerId);
        const distance = workerData.find((w) => w.id === score.workerId)?.distanceKm ?? 0;
        if (!worker) return null;
        return {
          id: worker.id,
          firstName: worker.firstName,
          lastName: worker.lastName,
          avatarUrl: worker.avatarUrl,
          rating: worker.rating,
          totalJobs: worker.totalJobs,
          hourlyRate: worker.hourlyRate,
          city: worker.city,
          distanceKm: Math.round(distance * 10) / 10,
          skills: workerData.find((w) => w.id === score.workerId)?.skills ?? [],
          matchScore: score.score,
          matchReasons: score.reasons,
          isAvailable: worker.isAvailable,
          idVerified: worker.idVerified,
        };
      })
      .filter(Boolean)
      .sort((a, b) => (b?.matchScore ?? 0) - (a?.matchScore ?? 0))
      .slice(0, 5); // top 5

    return {
      jobPreview: {
        title: analysis.title,
        description: analysis.description,
        categorySlug: analysis.categorySlug,
        categoryName: analysis.categoryName,
        urgency: analysis.urgency,
        priceMin: analysis.priceMin,
        priceMax: analysis.priceMax,
        estimatedHours: analysis.estimatedHours,
        toolsNeeded: analysis.toolsNeeded,
        summary: analysis.summary,
      },
      suggestedWorkers: rankedWorkers,
    };
  }

  async createJob(dto: CreateJobDto, clientId: string) {
    // Free plan cap: max 3 active jobs at a time
    const sub = await this.prisma.subscription.findUnique({ where: { userId: clientId } });
    const isPaid = sub?.isActive && sub.planType === 'CLIENT_BUSINESS';
    if (!isPaid) {
      const activeCount = await this.prisma.job.count({
        where: { clientId, status: { in: ['POSTED', 'ASSIGNED', 'IN_PROGRESS'] } },
      });
      if (activeCount >= 1) {
        throw new ForbiddenException(
          'Free plan limit reached. You can post 1 job on the free plan. Upgrade to Client Business for unlimited job posts.',
        );
      }
    }

    const category = dto.categorySlug
      ? await this.prisma.category.findUnique({ where: { slug: dto.categorySlug } })
      : null;

    const job = await this.prisma.job.create({
      data: {
        clientId,
        categoryId: category?.id ?? null,
        title: dto.title,
        description: dto.description,
        rawInput: dto.rawInput,
        priceMin: dto.priceMin,
        priceMax: dto.priceMax,
        urgency: dto.urgency ?? 'NORMAL',
        estimatedHours: dto.estimatedHours,
        toolsNeeded: dto.toolsNeeded ?? [],
        aiCategorySlug: dto.categorySlug,
        latitude: dto.latitude,
        longitude: dto.longitude,
        address: dto.address,
        city: dto.city,
        status: 'POSTED',
      },
      include: { category: true },
    });

    if (dto.directAssignWorkerId) {
      await this.prisma.jobApplication.create({
        data: {
          jobId: job.id,
          workerId: dto.directAssignWorkerId,
          status: 'NOTIFIED',
        },
      });
    }

    return job;
  }

  async findAll(userId: string, role: string) {
    if (role === 'CLIENT') {
      return this.prisma.job.findMany({
        where: { clientId: userId },
        include: { category: true, applications: true },
        orderBy: { createdAt: 'desc' },
      });
    }

    // Workers see all posted jobs
    return this.prisma.job.findMany({
      where: { status: 'POSTED' },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const job = await this.prisma.job.findUnique({
      where: { id },
      include: {
        category: true,
        applications: {
          include: {
            worker: { select: { firstName: true, lastName: true, rating: true, avatarUrl: true } },
          },
        },
      },
    });
    if (!job) throw new NotFoundException('Job not found');
    return job;
  }
}
