import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { ObjectType, Field, registerEnumType } from '@nestjs/graphql';
import { BasicEntity } from '../../../../core/common/types/basic.entity.type';
import { User } from '../../users/domain/user.entity';
import { NotificationType } from '../../websockets/types/websocket.types';
import { CreateNotificationInputDto } from '../interface/dto/input/create.notification.input.dto';

registerEnumType(NotificationType, {
  name: 'NotificationType',
});

@Entity()
@Index(['userId', 'createdAt'])
@ObjectType()
export class NotificationModel extends BasicEntity {
  @Column()
  @Field(() => String)
  message: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  @Field(() => NotificationType)
  type: NotificationType;

  @Column({ type: 'boolean', default: false })
  @Field(() => Boolean)
  isRead: boolean;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  @Field(() => User)
  user: User;

  @Column()
  @Index()
  @Field(() => Number)
  userId: number;

  @Field(() => Number)
  id: number;

  static createInstance(data: CreateNotificationInputDto) {
    const notification = new NotificationModel();
    notification.message = data.message;
    notification.type = data.type;
    notification.userId = data.userId;
    notification.isRead = data.isRead ?? false;
    return notification;
  }

  markAsRead() {
    this.isRead = true;
    return this;
  }

  markAsUnread() {
    this.isRead = false;
    return this;
  }
}
