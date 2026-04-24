import { Controller, Post, Get, Patch, Body, Param, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ApplicationsService } from './applications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('applications')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  // Worker applies to a job
  @Post('jobs/:jobId/apply')
  @ApiOperation({ summary: 'Worker: apply to a job' })
  apply(
    @Request() req: { user: { sub: string } },
    @Param('jobId') jobId: string,
    @Body() dto: { proposedPrice?: number; message?: string }
  ) {
    return this.applicationsService.apply(req.user.sub, jobId, dto);
  }

  // Client sees all applications for their job
  @Get('jobs/:jobId/applications')
  @ApiOperation({ summary: 'Client: get all applications for a job' })
  getApplications(@Request() req: { user: { sub: string } }, @Param('jobId') jobId: string) {
    return this.applicationsService.getJobApplications(req.user.sub, jobId);
  }

  // Client accepts an application
  @Patch('applications/:id/accept')
  @ApiOperation({ summary: 'Client: accept an application' })
  accept(@Request() req: { user: { sub: string } }, @Param('id') id: string) {
    return this.applicationsService.acceptApplication(req.user.sub, id);
  }

  // Client rejects an application
  @Patch('applications/:id/reject')
  @ApiOperation({ summary: 'Client: reject an application' })
  reject(@Request() req: { user: { sub: string } }, @Param('id') id: string) {
    return this.applicationsService.rejectApplication(req.user.sub, id);
  }

  // Worker withdraws their application
  @Patch('applications/:id/withdraw')
  @ApiOperation({ summary: 'Worker: withdraw an application' })
  withdraw(@Request() req: { user: { sub: string } }, @Param('id') id: string) {
    return this.applicationsService.workerWithdrawApplication(req.user.sub, id);
  }

  // Worker accepts a direct assignment
  @Patch('applications/:id/worker-accept')
  @ApiOperation({ summary: 'Worker: accept a direct assignment' })
  workerAccept(@Request() req: { user: { sub: string } }, @Param('id') id: string) {
    return this.applicationsService.workerAcceptAssignment(req.user.sub, id);
  }

  // Worker declines a direct assignment
  @Patch('applications/:id/worker-decline')
  @ApiOperation({ summary: 'Worker: decline a direct assignment' })
  workerDecline(@Request() req: { user: { sub: string } }, @Param('id') id: string) {
    return this.applicationsService.workerDeclineAssignment(req.user.sub, id);
  }

  // Client marks job as complete
  @Patch('jobs/:jobId/complete')
  @ApiOperation({ summary: 'Client: mark job as completed' })
  complete(@Request() req: { user: { sub: string } }, @Param('jobId') jobId: string) {
    return this.applicationsService.completeJob(req.user.sub, jobId);
  }

  // Client leaves a review
  @Post('jobs/:jobId/review')
  @ApiOperation({ summary: 'Client: leave a review for the worker' })
  review(
    @Request() req: { user: { sub: string } },
    @Param('jobId') jobId: string,
    @Body() dto: { rating: number; comment?: string }
  ) {
    return this.applicationsService.leaveReview(req.user.sub, jobId, dto);
  }
}
