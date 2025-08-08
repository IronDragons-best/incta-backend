import { Controller } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext, Transport } from '@nestjs/microservices';
import { EmailService } from '../application/email.service';
import { EmailInfoInputDto, OauthInputDto } from '../types/email.info.input.dto';
import { Channel, Message } from 'amqplib';
import { CustomLogger } from '@monitoring';
import { AppNotification, OauthTemplateType } from '@common';

@Controller()
export class EmailController {
  private readonly MAX_RETRY_ATTEMPTS = 3;
  private readonly RETRY_HEADER = 'x-retry-count';
  private readonly NESTJS_PATTERN_HEADER = 'x-pattern-id'; // Добавляем константу для заголовка паттерна NestJS

  constructor(
    private readonly emailService: EmailService,
    private readonly logger: CustomLogger,
  ) {
    this.logger.setContext('Email Controller');
  }

  @EventPattern('email.registration', Transport.RMQ)
  async handleEmailRegistration(
    @Payload() data: EmailInfoInputDto,
    @Ctx() context: RmqContext,
  ) {
    const email = data.email;

    try {
      this.logger.log(`Processing registration email for ${email}`);
      const result = await this.emailService.sendRegistrationEmail(data);
      this.handleMessage(context, email, !result.hasErrors());
    } catch (error) {
      this.logger.error(`Exception sending registration email to ${email}: ${error}`);
      this.handleMessage(context, email, false);
    }
  }

  @EventPattern('email.registration_resend', Transport.RMQ)
  async handleEmailRegistrationResend(
    @Payload() data: EmailInfoInputDto,
    @Ctx() context: RmqContext,
  ) {
    const email = data.email;

    try {
      this.logger.log(`Processing registration resend email for ${email}`);
      const result = await this.emailService.resendEmail(data);
      this.handleMessage(context, email, !result.hasErrors());
    } catch (error) {
      this.logger.error(`Exception resending registration email to ${email}: ${error}`);
      this.handleMessage(context, email, false);
    }
  }

  private getRetryCount(context: RmqContext): number {
    const msg = context.getMessage() as Message;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const retryCountHeader = (msg.properties?.headers as unknown)?.[this.RETRY_HEADER];
    return typeof retryCountHeader === 'string' ? parseInt(retryCountHeader, 10) : 0;
  }

  private handleMessage(context: RmqContext, email: string, isSuccess: boolean): void {
    const channel = context.getChannelRef() as Channel;
    const originalMsg = context.getMessage() as Message;
    let currentRetryCount = this.getRetryCount(context);

    if (isSuccess) {
      this.logger.log(`Email successfully processed for ${email}`);
      channel.ack(originalMsg);
      return;
    }

    currentRetryCount++;

    if (currentRetryCount >= this.MAX_RETRY_ATTEMPTS) {
      this.logger.error(
        `Email failed after ${this.MAX_RETRY_ATTEMPTS} attempts for ${email}. Rejecting.`,
      );
      channel.reject(originalMsg, false);
      return;
    }

    this.logger.error(
      `Email failed for ${email}. Retrying ${currentRetryCount}/${this.MAX_RETRY_ATTEMPTS}`,
    );

    const newMessage = originalMsg.content;

    const newHeaders = {
      ...originalMsg.properties.headers,
      [this.RETRY_HEADER]: String(currentRetryCount),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      [this.NESTJS_PATTERN_HEADER]:
        originalMsg.properties?.headers?.[this.NESTJS_PATTERN_HEADER],
    };

    const correlationId =
      typeof originalMsg.properties.correlationId === 'string'
        ? originalMsg.properties.correlationId
        : undefined;

    channel.publish(
      originalMsg.fields.exchange,
      originalMsg.fields.routingKey,
      newMessage,
      {
        correlationId: correlationId,
        headers: newHeaders,
        deliveryMode: 2,
      },
    );

    channel.ack(originalMsg);
  }

  @EventPattern('email.password_recovery', Transport.RMQ)
  async handlePasswordRecovery(
    @Payload() data: EmailInfoInputDto,
    @Ctx() context: RmqContext,
  ) {
    const { email } = data;

    try {
      this.logger.log(`Processing password recovery email for ${email}`);
      const result = await this.emailService.sendPasswordRecoveryEmail(data);
      this.handleMessage(context, email, !result.hasErrors());
    } catch (e: any) {
      this.logger.error(
        `Unhandled exception in handlePasswordRecovery for ${data.email}: ${e}`,
      );
      this.handleMessage(context, email, false);
    }
  }
  @EventPattern('email.provider', Transport.RMQ)
  async handleOauthProvider(@Payload() data: OauthInputDto, @Ctx() context: RmqContext) {
    const { template, email } = data;
    try {
      this.logger.log(`Processing oath email for ${email}`);
      let result: AppNotification;
      if (template === OauthTemplateType.ADD_PROVIDER) {
        result = await this.emailService.sendProviderAddedEmail(data);
        this.handleMessage(context, email, !result.hasErrors());
      } else if (template === OauthTemplateType.REGISTER_PROVIDER) {
        result = await this.emailService.sendProviderRegistrationEmail(data);
        this.handleMessage(context, email, !result.hasErrors());
      }
    } catch (error) {
      this.logger.error(`Unhandled exception in handleOauthProvider: ${error}`);
      this.handleMessage(context, email, false);
    }
  }
}
