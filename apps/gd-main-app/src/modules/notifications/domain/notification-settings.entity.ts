import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { ObjectType, Field } from '@nestjs/graphql';
import { BasicEntity } from '../../../../core/common/types/basic.entity.type';
import { User } from '../../users/domain/user.entity';
import { NotificationType } from '../../websockets/types/websocket.types';

@Entity()
@Index(['userId', 'notificationType'], { unique: true })
@ObjectType()
export class NotificationSettingsModel extends BasicEntity {
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  @Field(() => User)
  user: User;

  @Column()
  @Index()
  @Field(() => Number)
  userId: number;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  @Field(() => NotificationType)
  notificationType: NotificationType;

  @Column({ type: 'boolean', default: true })
  @Field(() => Boolean)
  isEnabled: boolean;

  @Field(() => Number)
  id: number;

  static createInstance(userId: number, notificationType: NotificationType, isEnabled = true) {
    const settings = new NotificationSettingsModel();
    settings.userId = userId;
    settings.notificationType = notificationType;
    settings.isEnabled = isEnabled;
    return settings;
  }

  enable() {
    this.isEnabled = true;
    return this;
  }

  disable() {
    this.isEnabled = false;
    return this;
  }
}
