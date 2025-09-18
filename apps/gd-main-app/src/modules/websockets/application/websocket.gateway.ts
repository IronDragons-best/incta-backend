import { Injectable, UnauthorizedException } from '@nestjs/common';
import {
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { WebsocketConnectionService } from './websocket-connection.service';
import { CustomLogger } from '@monitoring';
import { AppConfigService } from '@common';

@WebSocketGateway({ namespace: '/notifications' })
@Injectable()
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly connectionService: WebsocketConnectionService,
    private readonly logger: CustomLogger,
    private readonly configService: AppConfigService,
  ) {}

  handleConnection(@ConnectedSocket() client: Socket) {
    console.log('WS client connected', client.id, client.handshake.headers);
    try {
      console.log('client connected');
      const userId = this.authenticateSocket(client);

      console.log('userId', userId);

      this.connectionService.addConnection(userId, client);
      this.logger.log(`User ${userId} connected to WebSocket`);

      client.emit('connected', { message: 'Successfully connected to notifications' });
    } catch (error) {
      this.logger.error(`WebSocket authentication failed: ${error}`);
      client.disconnect();
    }
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
    for (const [userId, socket] of this.connectionService.getAllConnections()) {
      if (socket.id === client.id) {
        this.connectionService.removeConnection(userId);
        console.log(`User ${userId} disconnected from WebSocket`);
        break;
      }
    }
  }
  private extractTokenFromCookies(cookies: string, tokenName: string): string | null {
    const cookieArray = cookies.split(';');
    for (const cookie of cookieArray) {
      const [name, value] = cookie.trim().split('=');
      if (name === tokenName) {
        return value;
      }
    }
    return null;
  }
  private authenticateSocket(client: Socket): number {
    const cookies = client.handshake.headers.cookie;
    if (!cookies) {
      throw new UnauthorizedException('No cookies provided');
    }

    const accessToken = this.extractTokenFromCookies(cookies, 'accessToken');
    console.log(accessToken);
    if (!accessToken) {
      throw new UnauthorizedException('No access token provided');
    }

    try {
      console.log('token: ', accessToken);
      const payload: { id: number } = this.jwtService.verify(accessToken, {
        secret: this.configService.jwtAccessSecret,
      });
      console.log('payload', payload);
      return payload.id;
    } catch (error) {
      console.log(error);
      throw new UnauthorizedException('Invalid access token');
    }
  }
}
