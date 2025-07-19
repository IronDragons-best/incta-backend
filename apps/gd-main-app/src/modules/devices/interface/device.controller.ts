import { Controller, Delete, Get, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from '../../../../core/guards/local/jwt-auth-guard';

import { ExtractUserFromRequest } from '../../../../core/decorators/guard-decorators/extract.user.from.request.decorator';
import { AllUserDevicesSwagger } from '../../../../core/decorators/swagger-settings/devices/all.user.devices.decorator';

import { UserContextDto } from '../../../../core/dto/user.context.dto';

import { DevicesQueryRepository } from '../infrastructure/devices.query.repository';
import { CommandBus } from '@nestjs/cqrs';
import { DeleteOtherDevicesCommand } from '../application/delete.device.use.case';
import { RefreshGuard } from '../../../../core/guards/refresh/jwt.refresh.auth.guard';
import { DeleteOtherDevicesSwagger } from '../../../../core/decorators/swagger-settings/devices/delete.devices.swagger.decorator';

@Controller('devices')
export class DeviceController {
  constructor(
    private readonly devicesQueryRepository: DevicesQueryRepository,
    private readonly commandBus: CommandBus,
  ) {}

  @Get()
  @UseGuards(RefreshGuard)
  @AllUserDevicesSwagger()
  async getAllUserDevices(@ExtractUserFromRequest() user: UserContextDto) {
    return await this.devicesQueryRepository.findSessionsByUserId(user.id);
  }

  @Delete()
  @UseGuards(RefreshGuard)
  @DeleteOtherDevicesSwagger()
  @HttpCode(HttpStatus.NO_CONTENT)
  async terminateOtherSessions(@ExtractUserFromRequest() user: UserContextDto) {
    return await this.commandBus.execute(
      new DeleteOtherDevicesCommand(user.id, user.sessionId),
    );
  }
}
