import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChatService } from './chat.service';

@ApiTags('chat')
@Controller('chat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Get('conversations')
  getConversations(@Request() req: { user: { sub: string } }) {
    return this.chat.getConversations(req.user.sub);
  }

  @Get(':jobId/messages')
  getMessages(
    @Param('jobId') jobId: string,
    @Request() req: { user: { sub: string } },
  ) {
    return this.chat.getMessages(jobId, req.user.sub);
  }
}
