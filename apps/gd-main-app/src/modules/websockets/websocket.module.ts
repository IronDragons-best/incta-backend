import { Module } from '@nestjs/common';
import { WebsocketConnectionService } from './application/websocket-connection.service';
import { NotificationGateway } from './application/websocket.gateway';
import { WebsocketNotificationService } from './application/websocket-notification.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [JwtModule],
  providers: [
    NotificationGateway,
    WebsocketConnectionService,
    WebsocketNotificationService,
  ],
  exports: [WebsocketConnectionService],
})
export class WebsocketModule {}
