import { Controller } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext, Transport } from '@nestjs/microservices';
import { EmailService } from '../application/email.service';
import { EmailInfoInputDto } from '../types/email.info.input.dto';
import { Channel, ConsumeMessage } from 'amqplib';
import { CustomLogger } from '@monitoring';

@Controller()
export class EmailController {
  private readonly MAX_RETRY = 3;
  constructor(
    private readonly emailService: EmailService,
    private readonly logger: CustomLogger,
  ) {
    this.logger.setContext('Email Controller');
  }
  @EventPattern('email.registration', Transport.RMQ)
  async handleEmailSend(@Payload() data: EmailInfoInputDto, @Ctx() context: RmqContext) {
    const channel: Channel = context.getChannelRef() as Channel;
    const originalMsg: ConsumeMessage = context.getMessage() as ConsumeMessage;

    const xDeathHeader = originalMsg.properties?.headers?.['x-death'];
    const retryCount = Array.isArray(xDeathHeader) ? xDeathHeader.length : 0;

    if (retryCount >= this.MAX_RETRY) {
      this.logger.error('Email send failed');
      channel.reject(originalMsg, false);
      return;
    }

    const result = await this.emailService.sendRegistrationEmail(data);
    if (result.hasErrors()) {
      this.logger.error(result.getErrors());
      channel.nack(originalMsg, false, true);
    } else {
      this.logger.log(`Email successfully processed for ${data.email}.`);
      channel.ack(originalMsg);
    }
  }

  @EventPattern('email.registration_resend', Transport.RMQ)
  async handleMessage(@Payload() data: EmailInfoInputDto, @Ctx() context: RmqContext) {
    try {
      const channel = context.getChannelRef() as Channel;
      const originalMsg = context.getMessage() as ConsumeMessage;

      const xDeathHeader = originalMsg.properties?.headers?.['x-death'];
      const retryCount = Array.isArray(xDeathHeader) ? xDeathHeader.length : 0;
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
      if (result.hasErrors()) {
        this.logger.error(
          `Error processing email for ${data.email}: ${result.getErrors()}. Retrying...`,
        );
        channel.nack(originalMsg, false, false);
      } else {
        this.logger.log(`Email successfully processed for ${data.email}.`);
        channel.ack(originalMsg);
      }
    } catch (e) {
      this.logger.error(
        `Unhandled exception in handleMessage for ${data.email}: ${e.message}`,
      );
      const channel = context.getChannelRef() as Channel;
      const originalMsg = context.getMessage() as ConsumeMessage;
      channel.nack(originalMsg, false, false);
    }
  }
}
