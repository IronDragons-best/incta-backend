import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { User } from '../../users/domain/user.entity';
import { BasicEntity } from '../../../../core/common/types/basic.entity.type';

export enum AuthProvider {
  LOCAL = 'local',
  GOOGLE = 'google',
  GITHUB = 'github',
}

@Entity()
export class UserOauthProviderEntity extends BasicEntity {
  @Column({ type: 'enum', enum: AuthProvider })
  provider: AuthProvider;

  @Column()
  providerId: string;

  @ManyToOne(() => User, (user) => user.oauthProviders, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: number;
}
