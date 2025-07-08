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
      const link = `${this.configService.getProductionUrl()}/confirm-registration?code=${data.confirmCode}`;

      const textBody = [
        `Hi ${data.login},`,
        '',
        `Спасибо за регистрацию на Iron Dragon!`,
        `Чтобы завершить регистрацию, перейдите по ссылке:`,
        link,
        '',
        `Если вы не регистрировались — просто проигнорируйте это письмо.`,
        '',
        `С уважением,`,
        `Команда Iron Dragon`,
      ].join('\n');

      const htmlBody = `
      <p>Hi <strong>${data.login}</strong>,</p>
      <p>Спасибо за регистрацию на <strong>Iron Dragon</strong>! Чтобы завершить регистрацию, перейдите по ссылке:</p>
      <p><a href="${link}">Завершить регистрацию</a></p>
      <p>Если вы не регистрировались — просто проигнорируйте это письмо.</p>
      <p>С уважением,<br/>Команда Iron Dragon</p>
    `;

      await this.mailerService.sendMail({
        from: `"Iron Dragon site" <${this.configService.getMailerSenderAddress()}>`,
        to: data.email,
        subject: 'Завершите регистрацию на Iron Dragon',
        text: textBody,
        html: htmlBody,
      });
    } catch (e) {
      this.logger.error(e);
      notify.setServerError('Internal server error occurred while sending email');
    }
  }
}
