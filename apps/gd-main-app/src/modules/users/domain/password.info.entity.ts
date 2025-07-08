import { BasicEntity } from '../../../../core/common/types/basic.entity.type';
import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { User } from './user.entity';

@Entity()
export class PasswordInfo extends BasicEntity {
  @Column()
  passwordHash: string;

  @Column({ type: 'varchar', nullable: true })
  passwordRecoveryCode: string | null;

  @Column({ type: 'timestamp', nullable: true })
  passwordRecoveryCodeExpirationDate: Date | null;

  @OneToOne(() => User, (u) => u.passwordInfo, { nullable: false })
  @JoinColumn({ name: 'userId' })
  user: User;
}
