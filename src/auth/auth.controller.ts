import {
  Controller,
  Request,
  Response,
  Post,
  UseGuards,
  HttpCode,
  InternalServerErrorException,
  Get,
  Body,
  Param,
} from '@nestjs/common';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { AuthService } from './auth.service';
import { AccessTokenGuard } from './guards/jwt-auth.guard';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import RegisterDto from './dto/register.dto';
import { EmailVerifiedGuard } from './guards/email-verified.guard';
import { Public } from '../decorators/Public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(EmailVerifiedGuard)
  @UseGuards(LocalAuthGuard)
  @Public()
  @HttpCode(200)
  @Post('login')
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @Public()
  @HttpCode(201)
  @Post('register')
  async register(@Body() registrationData: RegisterDto, @Request() req) {
    const user = await this.authService.register(registrationData);

    if (!user) {
      throw new InternalServerErrorException();
    }

    await this.authService.sendVerificationEmail(
      registrationData.email,
      req.headers.origin,
    );

    return user;
  }

  @Public()
  @UseGuards(RefreshTokenGuard)
  @Get('refresh')
  async refresh(@Request() req) {
    return this.authService.refreshTokens(
      req.user.userId,
      req.user.refreshToken,
    );
  }

  @HttpCode(204)
  @UseGuards(AccessTokenGuard)
  @Get('logout')
  async logout(@Request() req) {
    this.authService.logout(req.user);
  }

  @Public()
  @Post('verify-email')
  async sendVerificationEmail(@Request() req) {
    await this.authService.sendVerificationEmail(
      req.body.email,
      req.headers.origin,
    );
  }

  @Public()
  @Get('verify-email')
  async verifyEmail(@Request() req, @Response() res) {
    await this.authService.verifyEmail(req.query.token);

    res.redirect(`${req.query.redirectUri}?verified=true`);
  }

  @Public()
  @Get('reset-password/:email')
  async sendResetPasswordEmail(@Request() req, @Param() params) {
    await this.authService.sendResetPasswordEmail(
      params.email,
      req.headers.origin,
    );
  }

  @Public()
  @Post('reset-password')
  async resetPassword(@Request() req) {
    return this.authService.resetPassword(req.body.token, req.body.password);
  }
}
