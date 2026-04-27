import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JobsService } from './jobs.service';
import { AnalyzeJobDto } from './dto/analyze-job.dto';
import { CreateJobDto } from './dto/create-job.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('jobs')
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  /**
   * Step 1: Client types a sentence → AI returns a full job preview + matched workers
   * This is the core AI feature. No auth required for demo purposes.
   */
  @Post('analyze')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'AI: analyze raw input and suggest job details + workers' })
  analyze(@Body() dto: AnalyzeJobDto) {
    return this.jobsService.analyzeAndPreview(dto);
  }

  /**
   * Step 2: Client confirms and posts the job (saves to DB)
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Post a job (after AI preview is confirmed)' })
  create(@Body() dto: CreateJobDto, @Request() req: { user: { sub: string } }) {
    return this.jobsService.createJob(dto, req.user.sub);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all posted jobs (client: own jobs, worker: nearby jobs)' })
  findAll(@Request() req: { user: { sub: string; role: string } }) {
    return this.jobsService.findAll(req.user.sub, req.user.role);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  findOne(@Param('id') id: string) {
    return this.jobsService.findOne(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Client: delete a job (no accepted application, 24h before scheduled date)' })
  deleteJob(@Param('id') id: string, @Request() req: { user: { sub: string } }) {
    return this.jobsService.deleteJob(id, req.user.sub);
  }
}
