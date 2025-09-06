import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PaymentsController } from './interface/payments.controller';
import { PaymentsService } from './payments.service';
import { CommonModule, monitoringValidationSchema, SharedConfigModule } from '@common';
import { MonitoringModule } from '@monitoring';
import { PaymentsConfigService } from '@common/config/payments.service';
import { Payment, PaymentSchema } from './domain/payment';
import { PaymentRabbitInitService } from './infrastructure/rabbit.infrastructure.service';

@Module({
  imports: [
    SharedConfigModule.forRoot({
      appName: 'payments-service',
      validationSchema: monitoringValidationSchema,
    }),
    MonitoringModule.forRoot('payments-microservice'),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const paymentsConfig = new PaymentsConfigService(configService['internalConfig']);
        const uri = paymentsConfig.paymentMongoUrl;

        return { uri };
      },
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([{ name: Payment.name, schema: PaymentSchema }]),
    CommonModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, PaymentsConfigService, PaymentRabbitInitService],
  exports: [PaymentsConfigService],
})
export class PaymentsModule {}
