import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ReportsService } from './reports.service';

@ApiTags('reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  create(
    @Request() req: { user: { sub: string } },
    @Body() body: { category: string; subject: string; description: string },
  ) {
    return this.reports.create(req.user.sub, body);
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  listAll() {
    return this.reports.listAll();
  }

  @Patch('admin/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string; adminNotes?: string },
  ) {
    return this.reports.updateStatus(id, body.status, body.adminNotes);
  }
}
