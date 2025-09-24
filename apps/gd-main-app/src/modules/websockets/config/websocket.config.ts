import { AppConfigService } from '@common';
import { Provider } from '@nestjs/common';

export const WEBSOCKET_CONFIG = 'WEBSOCKET_CONFIG';

export interface WebSocketConfig {
  cors: {
    origin: string | string[];
    credentials: boolean;
  };
}

export const WebSocketConfigProvider: Provider = {
  provide: WEBSOCKET_CONFIG,
  useFactory: (configService: AppConfigService): WebSocketConfig => {
    const corsOrigins =
      configService.depType === 'staging'
        ? [
            'http://localhost:3000',
            'http://127.0.0.1:3000',
            'https://localhost:3000',
            'https://127.0.0.1:3000',
            'https://front.nodewebdev.online:3000',
            'http://front.nodewebdev.online:3000',
          ]
        : configService.productionUrl;

    return {
      cors: {
        origin: corsOrigins,
        credentials: true,
      },
    };
  },
  inject: [AppConfigService],
};
