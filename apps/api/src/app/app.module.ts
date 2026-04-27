import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { JobsModule } from '../jobs/jobs.module';
import { AiModule } from '../ai/ai.module';
import { WorkersModule } from '../workers/workers.module';
import { ApplicationsModule } from '../applications/applications.module';
import { DashboardModule } from '../dashboard/dashboard.module';
import { StripeModule } from '../stripe/stripe.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { ChatModule } from '../chat/chat.module';
import { VerifyModule } from '../verify/verify.module';
import { PaymentsModule } from '../payments/payments.module';
import { ClientsModule } from '../clients/clients.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    StripeModule,
    AuthModule,
    JobsModule,
    AiModule,
    WorkersModule,
    ClientsModule,
    ApplicationsModule,
    DashboardModule,
    SubscriptionsModule,
    ChatModule,
    VerifyModule,
    PaymentsModule,
  ],
})
export class AppModule {}
