import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { RabbitMQMonitorService } from '../../../gd-main-app/core/common/adapters/rabbit.monitor-service';
import { CustomLogger } from '@monitoring';

@Injectable()
export abstract class PaymentBaseRabbitListener {
  constructor(
    @Inject('PAYMENT_SERVICE') protected readonly client: ClientProxy,
    protected readonly rabbitMonitor: RabbitMQMonitorService,
    protected readonly logger: CustomLogger,
  ) {}

  protected sendMessage(pattern: string, data: any): void {
    if (!this.rabbitMonitor.isAvailable()) {
      this.logger.warn(`RabbitMQ is down, skipping ${pattern} event`);
      return;
    }

    process.nextTick(() => {
      try {
        this.client.emit(pattern, data);
      } catch (error) {
        this.logger.error(`Failed to emit ${pattern}: ${error.message}`);
        this.rabbitMonitor.markAsDown();
      }
    });
  }
}
