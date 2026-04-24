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

  @Get(':id')
  @ApiOperation({ summary: 'Get public worker profile by id' })
  getPublicProfile(@Param('id') id: string) {
    return this.workersService.getPublicProfile(id);
  }
}
