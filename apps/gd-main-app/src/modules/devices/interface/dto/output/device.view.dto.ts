import { ApiProperty } from '@nestjs/swagger';

export class DeviceViewDto {
  @ApiProperty({
    description: 'Unique identifier of the device.',
    example: 'd67d5893-ab05-4c1e-b866-f4c8494ca03f',
  })
  deviceId: number;

  @ApiProperty({
    description: 'user id of the user associated with the device.',
    example: 'Ivan',
    nullable: true,
  })
  userId: number | null;

  @ApiProperty({
    description: 'Type of the device (e.g., "Chrome").',
    example: 'Chrome',
    nullable: true,
  })
  deviceName: string | null;

  @ApiProperty({
    description: 'IP address of the device.',
    example: '192.168.1.1',
    nullable: true,
  })
  ip: string | null;

  @ApiProperty({
    description: 'Session ID associated with the device.',
    example: 'd67d5893-ab05-4c1e-b866-f4c8494ca03f',
  })
  sessionId: string;

  @ApiProperty({
    description: 'Date and time when the device was last updated.',
    example: '2023-10-02T12:00:00Z',
    nullable: true,
  })
  updatedAt: Date | null;
}
