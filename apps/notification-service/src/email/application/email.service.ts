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

  private generateLink(code: string): string {
    return `${this.configService.getProductionUrl()}/confirm-registration?code=${code}`;
  }

  private async sendEmail(
    email: string,
    subject: string,
    textBody: string,
    htmlBody: string,
  ) {
    await this.mailerService.sendMail({
      from: `"Iron Dragon site" <${this.configService.getMailerSenderAddress()}>`,
      to: email,
      subject,
      text: textBody,
      html: htmlBody,
    });
  }

  async sendRegistrationEmail(data: EmailInfoInputDto) {
    const notify = this.notificationService.create();
    try {
      const link = this.generateLink(data.confirmCode);

      const subject = 'Завершите регистрацию на Iron Dragon';

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

      await this.sendEmail(data.email, subject, textBody, htmlBody);
    } catch (e) {
      this.logger.error(e);
      notify.setServerError(
        'Internal server error occurred while sending registration email',
      );
    }
  }

  async resendEmail(data: EmailInfoInputDto) {
    const notify = this.notificationService.create();
    try {
      const link = this.generateLink(data.confirmCode);

      const subject = 'Продолжите регистрацию на Iron Dragon';

      const textBody = [
        `Hi ${data.login},`,
        '',
        `Недавно вы начали регистрацию на Iron Dragon, но не завершили её.`,
        `Чтобы активировать аккаунт, перейдите по ссылке:`,
        link,
        '',
        `Если вы не создавали аккаунт — просто проигнорируйте это письмо.`,
        '',
        `С уважением,`,
        `Команда Iron Dragon`,
      ].join('\n');

      const htmlBody = `
        <p>Hi <strong>${data.login}</strong>,</p>
        <p>Недавно вы начали регистрацию на <strong>Iron Dragon</strong>, но не завершили её.</p>
        <p>Чтобы активировать аккаунт, перейдите по ссылке:</p>
        <p><a href="${link}">Подтвердить регистрацию</a></p>
        <p>Если вы не создавали аккаунт — просто проигнорируйте это письмо.</p>
        <p>С уважением,<br/>Команда Iron Dragon</p>
      `;

      await this.sendEmail(data.email, subject, textBody, htmlBody);
    } catch (e) {
      this.logger.error(e);
      notify.setServerError('Internal server error occurred while resending email');
    }
  }
}
