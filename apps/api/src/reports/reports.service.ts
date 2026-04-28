import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: { category: string; subject: string; description: string }) {
    return this.prisma.report.create({
      data: { userId, ...dto },
    });
  }

  async listAll() {
    return this.prisma.report.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            workerProfile: { select: { firstName: true, lastName: true } },
            clientProfile: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });
  }

  async updateStatus(id: string, status: string, adminNotes?: string) {
    const report = await this.prisma.report.findUnique({ where: { id } });
    if (!report) throw new NotFoundException('Report not found');
    return this.prisma.report.update({
      where: { id },
      data: { status: status as any, ...(adminNotes !== undefined ? { adminNotes } : {}) },
    });
  }
}
