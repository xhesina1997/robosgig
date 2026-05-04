import { Controller, Get, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ClientsService } from './clients.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('clients')
@Controller('clients')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get own client profile' })
  getProfile(@Request() req: { user: { sub: string } }) {
    return this.clientsService.getProfile(req.user.sub);
  }

  @Get('me/stats')
  @ApiOperation({ summary: 'Get client financial stats' })
  getStats(@Request() req: { user: { sub: string } }) {
    return this.clientsService.getStats(req.user.sub);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update own client profile' })
  updateProfile(
    @Request() req: { user: { sub: string } },
    @Body() dto: { firstName?: string; lastName?: string; phone?: string; city?: string; address?: string; latitude?: number; longitude?: number },
  ) {
    return this.clientsService.updateProfile(req.user.sub, dto);
  }
}
