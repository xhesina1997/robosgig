import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaymentsService } from './payments.service';

@ApiTags('payments')
@Controller('payments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /** Client: create Stripe Checkout session to pay for a job */
  @Post('jobs/:jobId/checkout')
  @ApiOperation({ summary: 'Client: create payment checkout for a job' })
  checkout(
    @Request() req: { user: { sub: string } },
    @Param('jobId') jobId: string,
  ) {
    return this.paymentsService.createJobCheckoutSession(req.user.sub, jobId);
  }

  /** Client: confirm payment after Stripe redirect */
  @Post('jobs/:jobId/confirm')
  @ApiOperation({ summary: 'Client: confirm job payment after Stripe redirect' })
  confirm(
    @Request() req: { user: { sub: string } },
    @Param('jobId') jobId: string,
    @Body() body: { sessionId: string },
  ) {
    return this.paymentsService.confirmJobPayment(req.user.sub, jobId, body.sessionId);
  }

  /** Client: get payment details for a job */
  @Get('jobs/:jobId')
  @ApiOperation({ summary: 'Client: get payment details for a job' })
  getPayment(
    @Request() req: { user: { sub: string } },
    @Param('jobId') jobId: string,
  ) {
    return this.paymentsService.getJobPayment(req.user.sub, jobId);
  }
}
