import { Controller, Post, Body } from '@nestjs/common';
import { AiService } from './ai.service';

@Controller('support')
export class SupportController {
  constructor(private ai: AiService) {}

  @Post('chat')
  async chat(@Body() body: { history: Array<{ role: 'user' | 'assistant'; content: string }> }) {
    const reply = await this.ai.supportChat(body.history);
    return { reply };
  }
}
