import { NotificationType } from '../../../../websockets/types/websocket.types';

export type CreateNotificationInputDto = {
  message: string;
  type: NotificationType;
  userId: number;
  isRead?: boolean;
};