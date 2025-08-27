import { BasicEntity } from '../../../../core/common/types/basic.entity.type';
import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { User } from './user.entity';

@Entity()
export class PasswordInfo extends BasicEntity {
  @Column({ type: 'varchar', nullable: true })
  passwordHash: string | null;

  @Column({ type: 'varchar', nullable: true })
  passwordRecoveryCode: string | null;

  @Column({ type: 'timestamp', nullable: true })
  passwordRecoveryCodeExpirationDate: Date | null;

  @OneToOne(() => User, (u) => u.passwordInfo, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
