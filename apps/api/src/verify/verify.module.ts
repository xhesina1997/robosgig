import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { StripeModule } from '../stripe/stripe.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { VerifyController } from './verify.controller';
import { VerifyService } from './verify.service';

@Module({
  imports: [PrismaModule, StripeModule, NotificationsModule],
  controllers: [VerifyController],
  providers: [VerifyService],
})
export class VerifyModule {}
