import {
  Controller,
  Request,
  Post,
  UseGuards,
  HttpCode,
  InternalServerErrorException,
  Get,
  Body,
} from '@nestjs/common';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { AuthService } from './auth.service';
import { AccessTokenGuard } from './guards/jwt-auth.guard';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import RegisterDto from './dto/register.dto';
import { EmailVerifiedGuard } from './guards/email-verified.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(EmailVerifiedGuard)
  @UseGuards(LocalAuthGuard)
  @HttpCode(200)
  @Post('login')
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @HttpCode(201)
  @Post('register')
  async register(@Body() registrationData: RegisterDto) {
    const user = await this.authService.register(registrationData);

    if (!user) {
      throw new InternalServerErrorException();
    }

    await this.authService.sendVerificationEmail(registrationData.email);

    return user;
  }

  @UseGuards(RefreshTokenGuard)
  @Get('refresh')
  async refresh(@Request() req) {
    return this.authService.refreshTokens(
      req.user.userId,
      req.user.refreshToken,
    );
  }

  @UseGuards(AccessTokenGuard)
  @Get('logout')
  async logout(@Request() req) {
    this.authService.logout(req.user);
  }

  @Get('verify-email')
  async verifyEmail(@Request() req) {
    return this.authService.verifyEmail(req.query.token);
  }
}
