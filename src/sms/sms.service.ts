import { BadRequestException, Injectable } from '@nestjs/common';
import { Twilio } from 'twilio';
import { UsersService } from '../users/users.service';

@Injectable()
export class SmsService {
  private twilioClient: Twilio;

  constructor(private readonly usersService: UsersService) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    this.twilioClient = new Twilio(accountSid, authToken);
  }

  initiatePhoneNumberVerification(phoneNumber: string) {
    const serviceSid = process.env.TWILIO_VERIFICATION_SERVICE_SID;

    return this.twilioClient.verify.v2
      .services(serviceSid)
      .verifications.create({ to: phoneNumber, channel: 'sms' });
  }

  async verifyPhoneNumber(
    userId: number,
    phoneNumber: string,
    verificationCode: string,
  ) {
    const serviceSid = process.env.TWILIO_VERIFICATION_SERVICE_SID;

    const result = await this.twilioClient.verify.v2
      .services(serviceSid)
      .verificationChecks.create({ to: phoneNumber, code: verificationCode });

    if (!result.valid || result.status !== 'approved') {
      throw new BadRequestException('Wrong code provided');
    }

    await this.usersService.updateUser({
      where: { id: userId },
      data: { isPhoneVerified: true },
    });
  }
}
