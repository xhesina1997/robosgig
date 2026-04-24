import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
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

  private signToken(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };
    return {
      accessToken: this.jwt.sign(payload),
      role,
    };
  }
}
