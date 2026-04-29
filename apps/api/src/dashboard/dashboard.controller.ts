import { Controller, Get, Query, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('client')
  getClientDashboard(
    @Request() req: { user: { sub: string } },
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.dashboardService.getClientDashboard(req.user.sub, +(skip ?? 0), +(take ?? 10));
  }

  @Get('worker')
  getWorkerDashboard(
    @Request() req: { user: { sub: string } },
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.dashboardService.getWorkerDashboard(req.user.sub, +(skip ?? 0), +(take ?? 10));
  }

  @Get('admin')
  getAdminDashboard() {
    return this.dashboardService.getAdminDashboard();
  }

  @Get('admin/users')
  getAdminUsers() {
    return this.dashboardService.getAdminUsers();
  }

  @Get('admin/subscriptions')
  getAdminSubscriptions() {
    return this.dashboardService.getAdminSubscriptions();
  }

  @Get('admin/conversations')
  getAdminConversations() {
    return this.dashboardService.getAdminConversations();
  }

  @Get('admin/conversations/:jobId/messages')
  getAdminConversationMessages(@Param('jobId') jobId: string) {
    return this.dashboardService.getAdminConversationMessages(jobId);
  }
}
