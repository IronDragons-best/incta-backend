import { Controller, Get, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../../../../core/guards/local/jwt-auth-guard';

import { ExtractUserFromRequest } from '../../../../core/decorators/guard-decorators/extract.user.from.request.decorator';
import { AllUserDevicesSwagger } from '../../../../core/decorators/swagger-settings/devices/all.user.devices.decorator';

import { UserContextDto } from '../../../../core/dto/user.context.dto';

import { DevicesQueryRepository } from '../infrastructure/devices.query.repository';

@Controller('devices')
export class DeviceController {
  constructor(private readonly devicesQueryRepository: DevicesQueryRepository) {}

  @Get()
  @AllUserDevicesSwagger()
  @UseGuards(JwtAuthGuard)
  async getAllUserDevices(@ExtractUserFromRequest() user: UserContextDto) {
    return await this.devicesQueryRepository.findSessionsByUserId(user.id);
  }
}
