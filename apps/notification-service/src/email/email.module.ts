import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { NotificationConfigService } from '@common/config/notification.config.service';
import { EmailService } from './application/email.service';
import { EmailController } from './interface/email.controller';
import { CommonModule } from '@common';

@Module({
  imports: [
    MailerModule.forRootAsync({
      useFactory: (configService: NotificationConfigService) => {
        return {
          transport: {
            host: configService.getMailerHost(),
            port: 465,
            secure: true,
            auth: {
              user: configService.getMailerSenderAddress(),
              pass: configService.getMailerSenderPassword(),
            },
          },
          defaults: {
            from: `Incta-Dragons <${configService.getMailerSenderAddress()}>`,
          },
        };
      },
      inject: [NotificationConfigService],
    }),
    CommonModule,
  ],
  controllers: [EmailController],
  providers: [EmailService],
})
export class EmailModule {}
g;
