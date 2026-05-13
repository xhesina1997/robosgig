import { Body, Controller, Post, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';

const ALLOWED_LANGUAGES = new Set(['en', 'de', 'sq', 'it']);

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private prisma: PrismaService) {}

  @Post('me/language')
  @ApiOperation({ summary: 'Update the authenticated user’s preferred language' })
  async updateLanguage(
    @Request() req: { user: { sub: string } },
    @Body() body: { language: string },
  ) {
    const lang = ALLOWED_LANGUAGES.has(body?.language) ? body.language : 'en';
    await this.prisma.user.update({ where: { id: req.user.sub }, data: { language: lang } });
    return { ok: true };
  }
}
