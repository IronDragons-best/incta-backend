import { BaseEntity, Column, Entity, ManyToOne } from 'typeorm';
import { User } from '../../users/domain/user.entity';

export enum AuthProvider {
  LOCAL = 'local',
  GOOGLE = 'google',
  GITHUB = 'github',
}
@Entity()
export class UserOauthProvider extends BaseEntity {
  @Column({ type: 'enum', enum: AuthProvider })
  provider: AuthProvider;

  @Column()
  providerId: string;

  @ManyToOne(() => User, (user) => user.oauthProviders, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  userId: number;
}
