import { Controller } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext, Transport } from '@nestjs/microservices';
import { EmailService } from '../application/email.service';
import { EmailInfoInputDto } from '../types/email.info.input.dto';
import { Channel, ConsumeMessage } from 'amqplib';
import { CustomLogger } from '@monitoring';
import { AppNotification } from '@common';

@Controller()
export class EmailController {
  private readonly MAX_RETRY = 3;

  constructor(
    private readonly emailService: EmailService,
    private readonly logger: CustomLogger,
  ) {
    this.logger.setContext('Email Controller');
  }

  private getChannelAndMessage(context: RmqContext): {
    channel: Channel;
    originalMsg: ConsumeMessage;
  } {
    const channel: Channel = context.getChannelRef() as Channel;
    const originalMsg: ConsumeMessage = context.getMessage() as ConsumeMessage;
    return { channel, originalMsg };
  }

  private getRetryCount(originalMsg: ConsumeMessage): number {
    const xDeathHeader = originalMsg.properties?.headers?.['x-death'];
    return Array.isArray(xDeathHeader) ? xDeathHeader.length : 0;
  }

  private handleServiceOperationResult(
    result: AppNotification,
    channel: Channel,
    originalMsg: ConsumeMessage,
    email: string,
    requeueOnNack: boolean,
  ): void {
    if (result.hasErrors()) {
      if (requeueOnNack) {
        this.logger.error(result.getErrors());
      } else {
        this.logger.error(`Error processing email for ${email}. Retrying...`);
      }
      channel.nack(originalMsg, false, requeueOnNack);
    } else {
      this.logger.log(`Email successfully processed for ${email}.`);
      channel.ack(originalMsg);
    }
  }

  @EventPattern('email.registration', Transport.RMQ)
  async handleEmailSend(@Payload() data: EmailInfoInputDto, @Ctx() context: RmqContext) {
    const { channel, originalMsg } = this.getChannelAndMessage(context);
    const retryCount = this.getRetryCount(originalMsg);

    if (retryCount >= this.MAX_RETRY) {
      this.logger.error('Email send failed');
      channel.reject(originalMsg, false);
      return;
    }

    const result = await this.emailService.sendRegistrationEmail(data);
    this.handleServiceOperationResult(result, channel, originalMsg, data.email, true);
  }

  @EventPattern('email.registration_resend', Transport.RMQ)
  async handleMessage(@Payload() data: EmailInfoInputDto, @Ctx() context: RmqContext) {
    const { channel, originalMsg } = this.getChannelAndMessage(context);
    const retryCount = this.getRetryCount(originalMsg);

    try {
      this.logger.log(
        `Received message for email.registration_resend. Retry count: ${retryCount}`,
      );

      if (retryCount >= this.MAX_RETRY) {
        this.logger.error(
          `Email send failed after ${retryCount} retries for ${data.email}. Rejecting permanently.`,
        );
        channel.reject(originalMsg, false);
        return;
      }

      const result = await this.emailService.resendEmail(data);

      this.handleServiceOperationResult(result, channel, originalMsg, data.email, false);
    } catch (e: any) {
      this.logger.error(`Unhandled exception in handleMessage for ${data.email}: ${e}`);
      channel.nack(originalMsg, false, false);
    }
  }

  @EventPattern('email.password_recovery', Transport.RMQ)
  async handlePasswordRecovery(@Payload() data: EmailInfoInputDto, @Ctx() context: RmqContext) {
    const { channel, originalMsg } = this.getChannelAndMessage(context);
    const retryCount = this.getRetryCount(originalMsg);

    try {
      if (retryCount >= this.MAX_RETRY) {
        this.logger.error(
          `Email send failed after ${retryCount} retries for ${data.email}. Rejecting permanently.`,
        );
        channel.reject(originalMsg, false);
        return;
      }

      const result = await this.emailService.sendPasswordRecoveryEmail(data);
      this.handleServiceOperationResult(result, channel, originalMsg, data.email, false);
    } catch (e: any) {
      this.logger.error(`Unhandled exception in handlePasswordRecovery for ${data.email}: ${e}`);
      channel.nack(originalMsg, false, false);
    }
  }
}
