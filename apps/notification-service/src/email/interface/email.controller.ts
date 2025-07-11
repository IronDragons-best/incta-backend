import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { EmailService } from '../application/email.service';
import { EmailInfoInputDto } from '../types/email.info.input.dto';

@Controller()
export class EmailController {
  constructor(private readonly emailService: EmailService) {}
  @EventPattern('email.registration')
  async handleEmailSend(@Payload() data: EmailInfoInputDto) {
    await this.emailService.sendRegistrationEmail(data);
  }
}
