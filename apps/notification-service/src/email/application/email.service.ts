import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { NotificationConfigService } from '@common/config/notification.config.service';
import { EmailInfoInputDto, OauthInputDto } from '../types/email.info.input.dto';
import { CustomLogger } from '@monitoring';
import { AppNotification, NotificationService } from '@common';

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
    try {
      await this.mailerService.sendMail({
        from: `"Iron Dragon site" <${this.configService.getMailerSenderAddress()}>`,
        to: email,
        subject,
        text: textBody,
        html: htmlBody,
      });
    } catch (e) {
      console.error(e);
    }
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
      return notify.setNoContent();
    } catch (e) {
      this.logger.error(e);
      notify.setServerError(
        'Internal server error occurred while sending registration email',
      );
      return notify;
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
      return notify.setNoContent();
    } catch (e) {
      this.logger.error(e);
      notify.setServerError('Internal server error occurred while resending email');
      return notify;
    }
  }

  async sendPasswordRecoveryEmail(data: EmailInfoInputDto) {
    const notify = this.notificationService.create();
    try {
      const link = this.generateLink(data.confirmCode);

      const subject = 'Восстановление пароля на Iron Dragon';

      const textBody = [
        `Hi ${data.login},`,
        '',
        `Вы запросили восстановление пароля на Iron Dragon.`,
        `Чтобы восстановить пароль, перейдите по ссылке:`,
        link,
        '',
        `Если вы не запрашивали восстановление — просто проигнорируйте это письмо.`,
        '',
        `С уважением,`,
        `Команда Iron Dragon`,
      ].join('\n');

      const htmlBody = `
        <p>Hi <strong>${data.login}</strong>,</p>
        <p>Вы запросили восстановление пароля на <strong>Iron Dragon</strong>.</p>
        <p>Чтобы восстановить пароль, перейдите по ссылке:</p>
        <p><a href="${link}">Восстановить пароль</a></p>
        <p>Если вы не запрашивали восстановление — просто проигнорируйте это письмо.</p>
        <p>С уважением,<br/>Команда Iron Dragon</p>
      `;

      await this.sendEmail(data.email, subject, textBody, htmlBody);
      return notify.setNoContent();
    } catch (e) {
      this.logger.error(e);
      notify.setServerError(
        'Internal server error occurred while sending password recovery email',
      );
      return notify;
    }
  }

  async sendProviderAddedEmail(data: OauthInputDto) {
    const notify = this.notificationService.create();
    try {
      const subject = `Аккаунт ${data.provider} подключен к Iron Dragon`;

      const textBody = [
        `Привет ${data.login}!`,
        '',
        `Ваш ${data.provider} аккаунт успешно подключен к вашему профилю Iron Dragon.`,
        `Теперь вы можете входить в систему, используя ${data.provider} авторизацию.`,
        '',
        `Если вы не подключали ${data.provider} аккаунт, немедленно обратитесь в службу поддержки.`,
        '',
        `Для вашей безопасности рекомендуем проверить активные сессии в настройках аккаунта.`,
        '',
        `С уважением,`,
        `Команда Iron Dragon`,
      ].join('\n');

      const htmlBody = `
      <p>Привет <strong>${data.login}</strong>!</p>
      <p>Ваш <strong>${data.provider}</strong> аккаунт успешно подключен к вашему профилю <strong>Iron Dragon</strong>.</p>
      <p>Теперь вы можете входить в систему, используя <strong>${data.provider}</strong> авторизацию.</p>
      <p><strong>⚠️ Если вы не подключали ${data.provider} аккаунт, немедленно обратитесь в службу поддержки.</strong></p>
      <p>Для вашей безопасности рекомендуем проверить активные сессии в настройках аккаунта.</p>
      <p>С уважением,<br/>Команда Iron Dragon</p>
  `;

      await this.sendEmail(data.email, subject, textBody, htmlBody);
      return notify.setNoContent();
    } catch (e) {
      this.logger.error(e);
      notify.setServerError(
        'Internal server error occurred while sending Oauth2 add email',
      );
      return notify;
    }
  }
  async sendProviderRegistrationEmail(data: OauthInputDto) {
    const notify = this.notificationService.create();

    try {
      const subject = 'Добро пожаловать в Iron Dragon!';

      const textBody = [
        `Привет ${data.login}!`,
        '',
        `Поздравляем с успешной регистрацией на Iron Dragon через ${data.provider}!`,
        `Ваш аккаунт создан и готов к использованию.`,
        '',
        `Вы можете войти в систему, используя свой ${data.provider} аккаунт.`,
        '',
        `Если у вас есть вопросы, не стесняйтесь обращаться к нашей поддержке.`,
        '',
        `С уважением,`,
        `Команда Iron Dragon`,
      ].join('\n');

      const htmlBody = `
    <p>Привет <strong>${data.login}</strong>!</p>
    <p>Поздравляем с успешной регистрацией на <strong>Iron Dragon</strong> через <strong>${data.provider}</strong>!</p>
    <p>Ваш аккаунт создан и готов к использованию.</p>
    <p>Вы можете войти в систему, используя свой <strong>${data.provider}</strong> аккаунт.</p>
    <p>Если у вас есть вопросы, не стесняйтесь обращаться к нашей поддержке.</p>
    <p>С уважением,<br/>Команда Iron Dragon</p>
  `;
      await this.sendEmail(data.email, subject, textBody, htmlBody);
      return notify.setNoContent();
    } catch (e) {
      this.logger.error(e);
      notify.setServerError(
        'Internal server error occurred while sending oauth2 registration email',
      );
      return notify;
    }
  }
}
