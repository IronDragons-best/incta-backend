import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { NotificationConfigService } from '@common/config/notification.config.service';
import { EmailInfoInputDto } from '../types/email.info.input.dto';
import { CustomLogger } from '@monitoring';
import { NotificationService } from '@common';

@Injectable()
export class EmailService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: NotificationConfigService,
    private readonly logger: CustomLogger,
    private readonly notificationService: NotificationService,
  ) {}

  async sendRegistrationEmail(data: EmailInfoInputDto) {
    const notify = this.notificationService.create();
    try {
      await this.mailerService.sendMail({
        from: `"Iron Dragon site" <${this.configService.getMailerSenderAddress()}>`,
        to: data.email,
        subject: 'Finish registration',
        html: `Hi ${data.login}! Thanks for your registration. 
        To finish registration, please follow the link below:
        <a href=${this.configService.getProductionUrl()}/confirm-registration?code=${data.confirmCode}>
     Complete registration!</a>`,
        headers: {
          'Content-Type': 'text/html; charset=UTF-8',
        },
      });
    } catch (e) {
      this.logger.error(e);
      notify.setServerError('Internal server error occurred while sending email');
    }
  }
}
