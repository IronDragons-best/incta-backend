import { UseInterceptors } from '@nestjs/common';
import { NotificationInterceptor } from '../interceptors/notification.interceptor';

export const UseNotificationInterceptor = () => UseInterceptors(NotificationInterceptor);
