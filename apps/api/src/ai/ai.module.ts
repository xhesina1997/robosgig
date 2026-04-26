import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { SupportController } from './support.controller';

@Module({
  controllers: [SupportController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
