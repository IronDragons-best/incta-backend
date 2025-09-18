import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';

@Injectable()
export class WebsocketConnectionService {
  private readonly connections = new Map<number, Socket>();

  addConnection(userId: number, socket: Socket) {
    console.log('hello from connection');
    this.connections.set(userId, socket);
  }

  removeConnection(userId: number) {
    this.connections.delete(userId);
  }

  getConnection(userId: number): Socket | undefined {
    return this.connections.get(userId);
  }

  getAllConnections() {
    return this.connections;
  }

  isUserOnline(userId: number) {
    return this.connections.has(userId);
  }
}
