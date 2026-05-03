import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WorkersController } from './workers.controller';
import { WorkersService } from './workers.service';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [AiModule, ConfigModule],
  controllers: [WorkersController],
  providers: [WorkersService],
})
export class WorkersModule {}
