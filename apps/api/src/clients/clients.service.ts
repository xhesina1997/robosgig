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
