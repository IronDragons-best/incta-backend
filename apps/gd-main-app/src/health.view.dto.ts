import { ApiProperty } from '@nestjs/swagger';

export type HealthType = {
  mainService: {
    status: string;
    timestamp: string;
  };
  filesService: {
    status: string;
    timestamp: string;
  };
};
export class FilesServiceInfo {
  @ApiProperty() status: string;
  @ApiProperty() timestamp: string;
}
export class MainServiceInfo {
  @ApiProperty() status: string;
  @ApiProperty() timestamp: string;
}

export class NotificationServiceInfo {
  @ApiProperty() status: string;
  @ApiProperty() timestamp: string;
}

export class HealthViewDto {
  @ApiProperty({ type: MainServiceInfo }) mainService: MainServiceInfo;
  @ApiProperty({ type: FilesServiceInfo }) filesService: FilesServiceInfo;
  @ApiProperty({ type: NotificationServiceInfo })
  notificationService: NotificationServiceInfo;

  public static mapToView(this: void, health: HealthType) {
    const dto = new HealthViewDto();
    dto.mainService = health.mainService;
    dto.filesService = health.filesService;
  }
}
