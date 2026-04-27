import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { StripeModule } from '../stripe/stripe.module';
import { VerifyController } from './verify.controller';
import { VerifyService } from './verify.service';

@Module({
  imports: [PrismaModule, StripeModule],
  controllers: [VerifyController],
  providers: [VerifyService],
})
export class VerifyModule {}
