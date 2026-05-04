import { Controller, Get, Patch, Post, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WorkersService } from './workers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('workers')
@Controller('workers')
export class WorkersController {
  constructor(private readonly workersService: WorkersService) {}

  @Get('skills')
  @ApiOperation({ summary: 'Get all available skills grouped by category' })
  getAllSkills() {
    return this.workersService.getAllSkills();
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get own worker profile' })
  getMyProfile(@Request() req: { user: { sub: string } }) {
    return this.workersService.getProfile(req.user.sub);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update own worker profile' })
  updateProfile(@Request() req: { user: { sub: string } }, @Body() dto: Record<string, unknown>) {
    return this.workersService.updateProfile(req.user.sub, dto);
  }

  @Get('me/jobs/map')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all open jobs for the map view (no pagination)' })
  getJobsForMap(@Request() req: { user: { sub: string } }) {
    return this.workersService.getJobsForMap(req.user.sub);
  }

  @Post('me/jobs/ai-filter')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Parse a natural language query into map filter params using AI' })
  parseAiFilter(
    @Request() req: { user: { sub: string } },
    @Body() body: { query: string },
  ) {
    return this.workersService.parseAiMapFilter(req.user.sub, body.query);
  }

  @Get('me/jobs/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get full job detail for the logged-in worker' })
  getJobDetail(@Request() req: { user: { sub: string } }, @Param('id') id: string) {
    return this.workersService.getJobDetail(req.user.sub, id);
  }

  @Get('me/jobs')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get nearby open jobs for the logged-in worker' })
  getNearbyJobs(
    @Request() req: { user: { sub: string } },
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.workersService.getNearbyJobs(req.user.sub, +(skip ?? 0), +(take ?? 10));
  }

  @Post('me/skills/:skillId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a skill to own profile' })
  addSkill(@Request() req: { user: { sub: string } }, @Param('skillId') skillId: string) {
    return this.workersService.addSkill(req.user.sub, skillId);
  }

  @Delete('me/skills/:skillId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove a skill from own profile' })
  removeSkill(@Request() req: { user: { sub: string } }, @Param('skillId') skillId: string) {
    return this.workersService.removeSkill(req.user.sub, skillId);
  }

  @Get('me/stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get worker financial stats' })
  getStats(@Request() req: { user: { sub: string } }) {
    return this.workersService.getStats(req.user.sub);
  }

  @Get('me/connect/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Stripe Connect account status' })
  getConnectStatus(@Request() req: { user: { sub: string } }) {
    return this.workersService.getConnectStatus(req.user.sub);
  }

  @Post('me/connect/onboard')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Start or resume Stripe Connect onboarding' })
  connectOnboard(@Request() req: { user: { sub: string } }) {
    return this.workersService.initiateConnectOnboarding(req.user.sub);
  }

  @Get('me/connect/dashboard')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Stripe Express dashboard link' })
  connectDashboard(@Request() req: { user: { sub: string } }) {
    return this.workersService.getConnectDashboardLink(req.user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get public worker profile by id' })
  getPublicProfile(@Param('id') id: string) {
    return this.workersService.getPublicProfile(id);
  }
}
