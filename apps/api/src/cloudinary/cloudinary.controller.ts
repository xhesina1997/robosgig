import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CloudinaryService } from './cloudinary.service';

@ApiTags('cloudinary')
@Controller('cloudinary')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CloudinaryController {
  constructor(private readonly cloudinary: CloudinaryService) {}

  @Post('signature')
  @ApiOperation({ summary: 'Get a signed upload payload for direct browser → Cloudinary upload' })
  getSignature(
    @Request() req: { user: { sub: string } },
    @Body() body: { folder?: string },
  ) {
    const folder = body?.folder ?? `robosgig/uploads/${req.user.sub}`;
    return this.cloudinary.getSignedUploadParams(folder);
  }
}
