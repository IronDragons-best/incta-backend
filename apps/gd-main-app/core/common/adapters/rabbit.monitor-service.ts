import { Injectable } from '@nestjs/common';
import { CustomLogger } from '@monitoring';

@Injectable()
export class RabbitMQMonitorService {
  private isRabbitDown = false;

  constructor(private readonly logger: CustomLogger) {
    this.monitorRabbitHealth();
    this.logger.setContext('RabbitMQMonitorService');
  }

  isAvailable(): boolean {
    return !this.isRabbitDown;
  }

  markAsDown(): void {
    this.isRabbitDown = true;
    this.logger.warn('RabbitMQ marked as unavailable');
  }

  private monitorRabbitHealth() {
    setInterval(() => {
      if (this.isRabbitDown) {
        this.isRabbitDown = false;
        this.logger.log('Attempting to reconnect to RabbitMQ');
      }
    }, 30000);
  }
}
