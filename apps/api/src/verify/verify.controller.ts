import {
  Controller, Get, Post, Body, Param, Headers,
  UseGuards, Request, Req, HttpCode,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import type { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { VerifyService } from './verify.service';

@ApiTags('verify')
@Controller('verify')
export class VerifyController {
  constructor(private readonly verify: VerifyService) {}

  @Get('status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getStatus(@Request() req: { user: { sub: string } }) {
    return this.verify.getStatus(req.user.sub);
  }

  @Post('session')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  createSession(
    @Request() req: { user: { sub: string } },
    @Body() body: { country?: string },
  ) {
    return this.verify.createSession(req.user.sub, body?.country);
  }

  @Post('manual')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  submitManual(
    @Request() req: { user: { sub: string } },
    @Body() body: { country: string; idFrontUrl: string; idBackUrl?: string | null; selfieUrl: string },
  ) {
    return this.verify.submitManual(req.user.sub, body);
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  listAll() {
    return this.verify.listAll();
  }

  @Post('admin/:id/approve')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  adminApprove(
    @Param('id') id: string,
    @Body() body: { documentType?: string },
  ) {
    return this.verify.adminApprove(id, body?.documentType);
  }

  @Post('admin/:id/reject')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  adminReject(
    @Param('id') id: string,
    @Body() body: { reason?: string },
  ) {
    return this.verify.adminReject(id, body?.reason);
  }

  @Post('webhook')
  @HttpCode(200)
  webhook(
    @Req() req: RawBodyRequest<ExpressRequest>,
    @Headers('stripe-signature') sig: string,
  ) {
    return this.verify.handleWebhook(req.rawBody as Buffer, sig);
  }
}
