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
    const { email, password } = user;

    if (!email || !password) {
      throw new BadRequestException('email and password are required');
    }

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

  sendVerificationEmail(email: string) {
    const verificationToken = this.jwtService.sign(
      { email },
      {
        expiresIn: process.env.JWT_EMAIL_VERIFICATION_TOKEN_EXPIRATION_TIME,
        secret: process.env.JWT_EMAIL_VERIFICATION_TOKEN_SECRET,
      },
    );

    const url = `${process.env.EMAIL_VERIFICATION_URL}?token=${verificationToken}`;
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

      if (typeof payload === 'object' && 'email' in payload) {
        const user = await this.usersService.findOne({ email: payload.email });

        if (!user) {
          throw new BadRequestException('User not found');
        }

        if (user.isEmailVerified) {
          throw new BadRequestException('Email already verified');
        }

        return await this.usersService.updateUser({
          where: { id: user.id },
          data: { isEmailVerified: true },
        });
      }

      throw new BadRequestException('Invalid confirmation token');
    } catch (error) {
      if (error?.name === 'TokenExpiredError') {
        throw new BadRequestException('Email confirmation token expired');
      }

      throw new BadRequestException('Invalid confirmation token');
    }
  }
}
