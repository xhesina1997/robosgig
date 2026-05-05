import { Controller, Post, Patch, Delete, Get, Body, HttpCode, HttpStatus, UseGuards, Request, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register as client or worker' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login and get JWT token' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth() {
    // Passport handles redirect to Google
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async googleCallback(@Request() req: { user: { email: string; firstName: string; lastName: string } }, @Res() res: any) {
    const { email, firstName, lastName } = req.user;
    const { accessToken, role } = await this.authService.findOrCreateGoogleUser(email, firstName, lastName);
    const frontendUrl = this.config.get<string>('APP_FRONTEND_URL') ?? 'http://localhost:4200';
    res.redirect(`${frontendUrl}/auth/callback?token=${accessToken}&role=${role}`);
  }

  @Delete('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete own account and all associated data' })
  deleteAccount(@Request() req: { user: { sub: string } }) {
    return this.authService.deleteAccount(req.user.sub);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email with code sent on registration' })
  verifyEmail(@Body() dto: { email: string; code: string }) {
    return this.authService.verifyEmail(dto.email, dto.code);
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend email verification code' })
  resendVerification(@Body() dto: { email: string }) {
    return this.authService.resendVerification(dto.email);
  }

  @Patch('password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change own password' })
  changePassword(
    @Request() req: { user: { sub: string } },
    @Body() dto: { currentPassword: string; newPassword: string },
  ) {
    return this.authService.changePassword(req.user.sub, dto.currentPassword, dto.newPassword);
  }
}
