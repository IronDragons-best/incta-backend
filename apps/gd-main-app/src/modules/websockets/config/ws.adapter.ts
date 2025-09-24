import { INestApplication } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';

export class WsAdapter extends IoAdapter {
  constructor(
    app: INestApplication,
    private cors: ServerOptions['cors'],
  ) {
    super(app);
  }

  createIOServer(port: number, options?: ServerOptions) {
    return super.createIOServer(port, {
      ...options,
      cors: this.cors,
    });
  }
}
