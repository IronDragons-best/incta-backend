import { InputType, Field } from '@nestjs/graphql';
import { NotificationType } from '../../../../websockets/types/websocket.types';

@InputType()
export class UpdateNotificationSettingsInputDto {
  @Field(() => NotificationType)
  notificationType: NotificationType;

  @Field(() => Boolean)
  isEnabled: boolean;
}
