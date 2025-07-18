import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { HealthSwagger } from '../core/decorators/swagger-settings/api-gateway/health.swagger.decorator';

@Controller('health')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @HealthSwagger()
  healthCheck() {
    return this.appService.healthCheck();
  }
}
