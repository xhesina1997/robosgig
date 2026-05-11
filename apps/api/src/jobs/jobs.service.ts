import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { AnalyzeJobDto } from './dto/analyze-job.dto';
import { CreateJobDto } from './dto/create-job.dto';
import { SaveDraftDto } from './dto/save-draft.dto';

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
        scheduledDate: dto.scheduledDate ? new Date(dto.scheduledDate) : null,
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

  /**
   * Save a draft. If `dto.id` is provided and belongs to the client, updates that draft.
   * Otherwise creates a new one. Multiple drafts per client are supported.
   */
  async saveDraft(dto: SaveDraftDto, clientId: string) {
    const titleSeed = (dto.title ?? dto.rawInput ?? '').trim().slice(0, 80) || 'Untitled draft';
    const category = dto.categorySlug
      ? await this.prisma.category.findUnique({ where: { slug: dto.categorySlug } })
      : null;

    if (dto.id) {
      const existing = await this.prisma.job.findUnique({ where: { id: dto.id } });
      if (!existing || existing.clientId !== clientId || existing.status !== 'DRAFT') {
        throw new NotFoundException('Draft not found');
      }
      return this.prisma.job.update({
        where: { id: dto.id },
        data: {
          rawInput: dto.rawInput ?? existing.rawInput,
          title: titleSeed,
          description: dto.description ?? existing.description,
          urgency: dto.urgency ?? existing.urgency,
          categoryId: category?.id ?? existing.categoryId,
          aiCategorySlug: dto.categorySlug ?? existing.aiCategorySlug,
          priceMin: dto.priceMin ?? existing.priceMin,
          priceMax: dto.priceMax ?? existing.priceMax,
          estimatedHours: dto.estimatedHours ?? existing.estimatedHours,
          toolsNeeded: dto.toolsNeeded ?? existing.toolsNeeded,
          latitude: dto.latitude ?? existing.latitude,
          longitude: dto.longitude ?? existing.longitude,
          address: dto.address ?? existing.address,
          city: dto.city ?? existing.city,
          scheduledDate: dto.scheduledDate ? new Date(dto.scheduledDate) : existing.scheduledDate,
        },
        include: { category: true },
      });
    }

    return this.prisma.job.create({
      data: {
        clientId,
        rawInput: dto.rawInput ?? '',
        title: titleSeed,
        description: dto.description ?? dto.rawInput ?? '',
        urgency: dto.urgency ?? 'NORMAL',
        categoryId: category?.id ?? null,
        aiCategorySlug: dto.categorySlug,
        priceMin: dto.priceMin,
        priceMax: dto.priceMax,
        estimatedHours: dto.estimatedHours,
        toolsNeeded: dto.toolsNeeded ?? [],
        latitude: dto.latitude,
        longitude: dto.longitude,
        address: dto.address,
        city: dto.city,
        scheduledDate: dto.scheduledDate ? new Date(dto.scheduledDate) : null,
        status: 'DRAFT',
      },
      include: { category: true },
    });
  }

  async listDrafts(clientId: string) {
    return this.prisma.job.findMany({
      where: { clientId, status: 'DRAFT' },
      orderBy: { updatedAt: 'desc' },
      include: { category: true },
    });
  }

  async deleteDraft(draftId: string, clientId: string) {
    const draft = await this.prisma.job.findUnique({ where: { id: draftId } });
    if (!draft || draft.clientId !== clientId || draft.status !== 'DRAFT') {
      throw new NotFoundException('Draft not found');
    }
    await this.prisma.job.delete({ where: { id: draftId } });
    return { deleted: true };
  }

  /**
   * Convert a draft into a posted job (subject to the same free-plan caps).
   */
  async publishDraft(draftId: string, clientId: string) {
    const draft = await this.prisma.job.findUnique({ where: { id: draftId } });
    if (!draft || draft.clientId !== clientId || draft.status !== 'DRAFT') {
      throw new NotFoundException('Draft not found');
    }

    // Same free-plan cap as createJob
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

    return this.prisma.job.update({
      where: { id: draftId },
      data: { status: 'POSTED' },
      include: { category: true },
    });
  }

  async deleteJob(jobId: string, clientId: string) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: { applications: { select: { status: true } } },
    });
    if (!job) throw new NotFoundException('Job not found');
    if (job.clientId !== clientId) throw new ForbiddenException('Not your job');

    const blocked = ['ACCEPTED', 'ASSIGNED', 'IN_PROGRESS'];
    const hasActive = job.applications.some(a => blocked.includes(a.status));
    if (hasActive) throw new BadRequestException('Cannot delete a job with an accepted application');

    if (job.scheduledDate) {
      const hoursUntil = (job.scheduledDate.getTime() - Date.now()) / (1000 * 60 * 60);
      if (hoursUntil < 24) throw new BadRequestException('Cannot delete a job less than 24 hours before the scheduled date');
    }

    await this.prisma.$transaction([
      this.prisma.jobApplication.deleteMany({ where: { jobId } }),
      this.prisma.message.deleteMany({ where: { jobId } }),
      this.prisma.review.deleteMany({ where: { jobId } }),
      this.prisma.job.delete({ where: { id: jobId } }),
    ]);

    return { deleted: true };
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
