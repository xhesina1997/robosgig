import { Injectable, ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) throw new ConflictException('Email already registered');

    const hash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hash,
        role: dto.role,
        ...(dto.role === 'WORKER'
          ? {
              workerProfile: {
                create: {
                  firstName: dto.firstName,
                  lastName: dto.lastName,
                  latitude: dto.latitude ?? 48.2082,
                  longitude: dto.longitude ?? 16.3738,
                  address: dto.address ?? '',
                  city: dto.city ?? 'Vienna',
                  hourlyRate: dto.hourlyRate,
                },
              },
            }
          : {
              clientProfile: {
                create: {
                  firstName: dto.firstName,
                  lastName: dto.lastName,
                  latitude: dto.latitude,
                  longitude: dto.longitude,
                  address: dto.address,
                  city: dto.city,
                },
              },
            }),
      },
    });

    return this.signToken(user.id, user.email, user.role);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return this.signToken(user.id, user.email, user.role);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) throw new BadRequestException('Current password is incorrect.');

    const hash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({ where: { id: userId }, data: { password: hash } });
    return { updated: true };
  }

  async deleteAccount(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        jobsPosted: { where: { status: { in: ['ASSIGNED', 'IN_PROGRESS'] } }, select: { id: true } },
        workerProfile: {
          include: { applications: { where: { status: 'ACCEPTED' }, select: { id: true } } },
        },
        clientProfile: { select: { id: true } },
      },
    });
    if (!user) throw new UnauthorizedException();

    if (user.jobsPosted.length > 0) {
      throw new BadRequestException('Cannot delete account while you have active jobs in progress.');
    }
    if ((user.workerProfile?.applications?.length ?? 0) > 0) {
      throw new BadRequestException('Cannot delete account while you have an accepted job assignment in progress.');
    }

    const jobIds = (await this.prisma.job.findMany({ where: { clientId: userId }, select: { id: true } })).map(j => j.id);

    const ops: any[] = [];

    if (user.workerProfile) {
      ops.push(this.prisma.review.deleteMany({ where: { workerId: user.workerProfile.id } }));
      ops.push(this.prisma.jobApplication.deleteMany({ where: { workerId: user.workerProfile.id } }));
      ops.push(this.prisma.workerSkill.deleteMany({ where: { workerId: user.workerProfile.id } }));
    }

    if (jobIds.length > 0) {
      ops.push(this.prisma.review.deleteMany({ where: { jobId: { in: jobIds } } }));
      ops.push(this.prisma.jobApplication.deleteMany({ where: { jobId: { in: jobIds } } }));
      ops.push(this.prisma.message.deleteMany({ where: { jobId: { in: jobIds } } }));
      ops.push(this.prisma.payment.deleteMany({ where: { jobId: { in: jobIds } } }));
      ops.push(this.prisma.job.deleteMany({ where: { clientId: userId } }));
    }

    ops.push(this.prisma.message.deleteMany({ where: { senderId: userId } }));
    ops.push(this.prisma.identityVerification.deleteMany({ where: { userId } }));
    ops.push(this.prisma.subscription.deleteMany({ where: { userId } }));
    if (user.workerProfile) ops.push(this.prisma.workerProfile.delete({ where: { userId } }));
    if (user.clientProfile) ops.push(this.prisma.clientProfile.delete({ where: { userId } }));
    ops.push(this.prisma.user.delete({ where: { id: userId } }));

    await this.prisma.$transaction(ops);
    return { deleted: true };
  }

  private signToken(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };
    return {
      accessToken: this.jwt.sign(payload),
      role,
    };
  }
}
