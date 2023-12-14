import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from 'src/email/email.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly emailService: EmailService,
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findOne({ email });

    if (!user) {
      throw new UnauthorizedException('Invalid user email or password');
    }

    const isPasswordMatching = await bcrypt.compare(password, user.password);

    if (user && isPasswordMatching) {
      const { ...result } = user;
      return result;
    }

    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, userId: user.id };

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRATION_TIME,
      secret: process.env.JWT_REFRESH_TOKEN_SECRET,
    });

    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_SALT_ROUNDS));
    const hashedRefreshToken = await bcrypt.hash(refreshToken, salt);

    this.usersService.updateUser({
      where: { id: user.id },
      data: { refreshToken: hashedRefreshToken },
    });

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRATION_TIME,
      secret: process.env.JWT_ACCESS_TOKEN_SECRET,
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  async register(user: any) {
    let { email, password } = user;

    if (!email || !password) {
      throw new BadRequestException('email and password are required');
    }

    email = email.trim();
    email = email.toLowerCase();

    password = password.trim();

    const existingUser = await this.usersService.findOne({ email });

    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_SALT_ROUNDS));
    const hashedPassword = await bcrypt.hash(password, salt);

    user.password = hashedPassword;
    const newUser = await this.usersService.createUser(user);

    return newUser;
  }

  async refreshTokens(userId: number, refreshToken: string) {
    const existingUser = await this.usersService.findOne({ id: userId });

    if (!existingUser || !existingUser.refreshToken) {
      throw new ForbiddenException('Access denied');
    }

    // Check that the the refresh token is valid
    const isRefreshTokenMatching = await bcrypt.compare(
      refreshToken,
      existingUser.refreshToken,
    );

    if (!isRefreshTokenMatching) {
      throw new ForbiddenException('Access denied');
    }

    const payload = { email: existingUser.email, sub: existingUser.id };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRATION_TIME,
      secret: process.env.JWT_ACCESS_TOKEN_SECRET,
    });

    const newRefreshToken = this.jwtService.sign(payload, {
      expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRATION_TIME,
      secret: process.env.JWT_REFRESH_TOKEN_SECRET,
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(user: any) {
    return this.usersService.updateUser({
      where: { id: user.userId },
      data: { refreshToken: null },
    });
  }

  sendVerificationEmail(email: string, origin: string) {
    const verificationToken = this.jwtService.sign(
      { email },
      {
        expiresIn: process.env.JWT_EMAIL_VERIFICATION_TOKEN_EXPIRATION_TIME,
        secret: process.env.JWT_EMAIL_VERIFICATION_TOKEN_SECRET,
      },
    );

    const clientUrl = `${origin}`;
    const url = `${process.env.EMAIL_VERIFICATION_URL}?token=${verificationToken}&redirectUri=${clientUrl}`;
    const text = `Welcome to ${process.env.APP_NAME}, \n\nPlease click on the following link ${url} to verify your account.`;

    const mailOptions = {
      to: email,
      subject: `${process.env.APP_NAME} - Email verification`,
      text,
    };

    return this.emailService.sendMail(mailOptions);
  }

  async verifyEmail(token: string) {
    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_EMAIL_VERIFICATION_TOKEN_SECRET,
      });

      if (typeof payload !== 'object' || !('email' in payload)) {
        throw new BadRequestException('Invalid confirmation token');
      }

      const user = await this.usersService.findOne({ email: payload.email });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      if (user.isEmailVerified) {
        throw new BadRequestException('Email already verified');
      }

      await this.usersService.updateUser({
        where: { id: user.id },
        data: { isEmailVerified: true },
      });
    } catch (error) {
      if (error?.name === 'TokenExpiredError') {
        throw new BadRequestException('Email confirmation token expired');
      }

      throw new BadRequestException('Invalid confirmation token');
    }
  }

  async sendResetPasswordEmail(email: string, origin: string) {
    const existingUser = await this.usersService.findOne({ email });

    if (!existingUser) {
      throw new BadRequestException('User not found');
    }

    if (!existingUser.isEmailVerified) {
      throw new BadRequestException('Email not verified');
    }

    const resetPasswordToken = this.jwtService.sign(
      { email },
      {
        expiresIn: process.env.JWT_RESET_PASSWORD_TOKEN_EXPIRATION_TIME,
        secret: process.env.JWT_RESET_PASSWORD_TOKEN_SECRET,
      },
    );

    existingUser.resetPasswordToken = resetPasswordToken;

    await this.usersService.updateUser({
      where: { id: existingUser.id },
      data: { resetPasswordToken },
    });

    const clientUrl = origin || process.env.CLIENT_URL;
    const url = `${clientUrl}/reset-password?token=${resetPasswordToken}`;

    let text =
      'You are receiving this email because you have requested the reset of the password for your account.\n\n';
    text += `Please click on the following link ${url} to complete the process. The link will only be valid for 10 minutes.\n\n`;
    text +=
      'If you did not request this, please ignore this email and your password will remain unchanged.';

    const mailOptions = {
      to: email,
      subject: `${process.env.APP_NAME} - Reset password`,
      text,
    };

    return this.emailService.sendMail(mailOptions);
  }

  async resetPassword(token: string, newPassword: string) {
    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_RESET_PASSWORD_TOKEN_SECRET,
      });

      if (typeof payload === 'object' && 'email' in payload) {
        const user = await this.usersService.findOne({ email: payload.email });

        if (!user) {
          throw new BadRequestException('User not found');
        }

        if (!user.resetPasswordToken || user.resetPasswordToken !== token) {
          throw new BadRequestException('Invalid reset password token');
        }

        const salt = await bcrypt.genSalt(
          parseInt(process.env.BCRYPT_SALT_ROUNDS),
        );
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        return await this.usersService.updateUser({
          where: { id: user.id },
          data: {
            password: hashedPassword,
            resetPasswordToken: null,
          },
        });
      }

      throw new BadRequestException('Invalid reset password token');
    } catch (error) {
      if (error?.name === 'TokenExpiredError') {
        throw new BadRequestException('Reset password token expired');
      }

      throw new BadRequestException('Invalid reset password token');
    }
  }
}
