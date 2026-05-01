import { Module } from '@nestjs/common';
import { WorkersController } from './workers.controller';
import { WorkersService } from './workers.service';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [AiModule],
  controllers: [WorkersController],
  providers: [WorkersService],
})
export class WorkersModule {}
