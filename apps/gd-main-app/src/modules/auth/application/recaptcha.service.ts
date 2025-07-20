import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { RecaptchaResponse } from '@common/exceptions/recaptcha.type';

@Injectable()
export class RecaptchaService {
  private readonly secretKey: string;
  private readonly isEnabled: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.secretKey = this.configService.getOrThrow<string>('RECAPTCHA_PRIVATE_KEY');
    this.isEnabled = this.configService.getOrThrow<string>('RECAPTCHA_ENABLED') !== 'false';
  }

  async validateToken(token: string): Promise<RecaptchaResponse> {
    if (!this.isEnabled) {
      return { success: true } as RecaptchaResponse; // мок
    }

    const result = await firstValueFrom(
      this.httpService.post<RecaptchaResponse>(
        'https://www.google.com/recaptcha/api/siteverify',
        new URLSearchParams({
          secret: this.secretKey,
          response: token,
        }),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        },
      ),
    );
    return result.data;
  }
}
