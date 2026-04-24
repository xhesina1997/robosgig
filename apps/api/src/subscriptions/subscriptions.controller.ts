import {
  Controller, Get, Post, Delete, Body, Headers,
  UseGuards, Request, Req, HttpCode, HttpStatus,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SubscriptionsService, PlanType } from './subscriptions.service';

@ApiTags('subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my current subscription' })
  getMySubscription(@Request() req: { user: { sub: string } }) {
    return this.subscriptionsService.getMySubscription(req.user.sub);
  }

  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create Stripe checkout session for a plan' })
  createCheckout(
    @Request() req: { user: { sub: string } },
    @Body() body: { planType: PlanType },
  ) {
    return this.subscriptionsService.createCheckoutSession(req.user.sub, body.planType);
  }

  @Post('activate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Activate subscription after Stripe success (dev/fallback)' })
  activate(
    @Request() req: { user: { sub: string } },
    @Body() body: { planType: string; sessionId: string },
  ) {
    return this.subscriptionsService.activateSubscription(req.user.sub, body.planType, body.sessionId);
  }

  @Delete('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel current subscription' })
  cancel(@Request() req: { user: { sub: string } }) {
    return this.subscriptionsService.cancelSubscription(req.user.sub);
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Stripe webhook endpoint (raw body required)' })
  webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') sig: string,
  ) {
    return this.subscriptionsService.handleWebhook(req.rawBody ?? Buffer.alloc(0), sig);
  }
}
