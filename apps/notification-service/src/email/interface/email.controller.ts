import { Controller } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { EmailService } from '../application/email.service';
import { EmailInfoInputDto, RmqMessage } from '../types/email.info.input.dto';
import { Channel, Message } from 'amqplib';

@Controller()
export class EmailController {
  constructor(private readonly emailService: EmailService) {}
  @EventPattern('email.registration')
  async handleEmailSend(@Payload() data: EmailInfoInputDto) {
    console.log('email registration ', new Date().getTime());

    await this.emailService.sendRegistrationEmail(data);
  }

  @EventPattern('email.registration_resend')
  async handleMessage(@Payload() payload: RmqMessage<EmailInfoInputDto>) {
    await this.emailService.resendEmail(payload.data);
  }
}
