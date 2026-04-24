import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class VerifyService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    cloudinary.config({
      cloud_name: this.config.get('CLOUDINARY_CLOUD_NAME'),
      api_key: this.config.get('CLOUDINARY_API_KEY'),
      api_secret: this.config.get('CLOUDINARY_API_SECRET'),
    });
  }

  async getStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { idVerified: true, verification: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return {
      idVerified: user.idVerified,
      verification: user.verification ?? null,
    };
  }

  async submitVerification(userId: string, documentBuffer: Buffer, documentMime: string, selfieBuffer?: Buffer) {
    const existing = await this.prisma.identityVerification.findUnique({ where: { userId } });
    if (existing?.status === 'VERIFIED') {
      throw new BadRequestException('Already verified');
    }

    const documentUrl = await this.uploadToCloudinary(documentBuffer, documentMime, `verifications/${userId}/doc`);
    let selfieUrl: string | undefined;
    if (selfieBuffer) {
      selfieUrl = await this.uploadToCloudinary(selfieBuffer, 'image/jpeg', `verifications/${userId}/selfie`);
    }

    const verification = await this.prisma.identityVerification.upsert({
      where: { userId },
      create: { userId, documentUrl, selfieUrl, status: 'PENDING' },
      update: { documentUrl, selfieUrl, status: 'PENDING', rejectionNote: null, reviewedAt: null, submittedAt: new Date() },
    });

    return verification;
  }

  // ── Admin ────────────────────────────────────────────────────────────────

  async listPending() {
    return this.prisma.identityVerification.findMany({
      where: { status: 'PENDING' },
      include: {
        user: {
          select: {
            id: true, email: true, role: true,
            workerProfile: { select: { firstName: true, lastName: true, avatarUrl: true } },
            clientProfile: { select: { firstName: true, lastName: true, avatarUrl: true } },
          },
        },
      },
      orderBy: { submittedAt: 'asc' },
    });
  }

  async listAll() {
    return this.prisma.identityVerification.findMany({
      include: {
        user: {
          select: {
            id: true, email: true, role: true,
            workerProfile: { select: { firstName: true, lastName: true, avatarUrl: true } },
            clientProfile: { select: { firstName: true, lastName: true, avatarUrl: true } },
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });
  }

  async approve(adminId: string, userId: string) {
    await this.assertAdmin(adminId);
    const v = await this.prisma.identityVerification.findUnique({ where: { userId } });
    if (!v) throw new NotFoundException('Verification request not found');

    await this.prisma.$transaction([
      this.prisma.identityVerification.update({
        where: { userId },
        data: { status: 'VERIFIED', reviewedAt: new Date(), rejectionNote: null },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { idVerified: true },
      }),
    ]);

    return { approved: true };
  }

  async reject(adminId: string, userId: string, note?: string) {
    await this.assertAdmin(adminId);
    const v = await this.prisma.identityVerification.findUnique({ where: { userId } });
    if (!v) throw new NotFoundException('Verification request not found');

    await this.prisma.identityVerification.update({
      where: { userId },
      data: { status: 'REJECTED', reviewedAt: new Date(), rejectionNote: note ?? null },
    });

    return { rejected: true };
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  private async assertAdmin(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (user?.role !== 'ADMIN') throw new ForbiddenException('Admin only');
  }

  private uploadToCloudinary(buffer: Buffer, mime: string, publicId: string): Promise<string> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { public_id: publicId, resource_type: 'image', overwrite: true },
        (err, result) => {
          if (err || !result) return reject(err ?? new Error('Upload failed'));
          resolve(result.secure_url);
        },
      ).end(buffer);
    });
  }
}
