import {
  Controller, Get, Post, Patch, Body, Param,
  UseGuards, Request, UseInterceptors, UploadedFiles,
  ParseFilePipe, MaxFileSizeValidator, FileTypeValidator,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { VerifyService } from './verify.service';
import { memoryStorage } from 'multer';

@ApiTags('verify')
@Controller('verify')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class VerifyController {
  constructor(private readonly verify: VerifyService) {}

  @Get('status')
  getStatus(@Request() req: { user: { sub: string } }) {
    return this.verify.getStatus(req.user.sub);
  }

  @Post('submit')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files', 2, { storage: memoryStorage() }))
  async submit(
    @Request() req: { user: { sub: string } },
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10 MB
          new FileTypeValidator({ fileType: /image\/(jpeg|png|webp)/ }),
        ],
      }),
    )
    files: Express.Multer.File[],
  ) {
    const [doc, selfie] = files;
    return this.verify.submitVerification(
      req.user.sub,
      doc.buffer,
      doc.mimetype,
      selfie?.buffer,
    );
  }

  // ── Admin endpoints ──────────────────────────────────────────────────────

  @Get('admin/all')
  listAll(@Request() req: { user: { sub: string } }) {
    return this.verify.listAll();
  }

  @Get('admin/pending')
  listPending(@Request() req: { user: { sub: string } }) {
    return this.verify.listPending();
  }

  @Patch('admin/:userId/approve')
  approve(
    @Request() req: { user: { sub: string } },
    @Param('userId') userId: string,
  ) {
    return this.verify.approve(req.user.sub, userId);
  }

  @Patch('admin/:userId/reject')
  reject(
    @Request() req: { user: { sub: string } },
    @Param('userId') userId: string,
    @Body() body: { note?: string },
  ) {
    return this.verify.reject(req.user.sub, userId, body.note);
  }
}
