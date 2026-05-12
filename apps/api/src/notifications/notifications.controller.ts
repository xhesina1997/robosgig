import { Controller, Get, Post, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'List own notifications (most recent first)' })
  list(@Request() req: { user: { sub: string } }) {
    return this.notifications.list(req.user.sub);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Count of unread notifications' })
  async unreadCount(@Request() req: { user: { sub: string } }) {
    const count = await this.notifications.unreadCount(req.user.sub);
    return { count };
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'Mark a notification read' })
  markRead(@Request() req: { user: { sub: string } }, @Param('id') id: string) {
    return this.notifications.markRead(req.user.sub, id);
  }

  @Post('read-all')
  @ApiOperation({ summary: 'Mark all notifications read' })
  markAllRead(@Request() req: { user: { sub: string } }) {
    return this.notifications.markAllRead(req.user.sub);
  }
}
