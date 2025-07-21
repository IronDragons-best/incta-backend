import { BasicEntity } from '../../../../core/common/types/basic.entity.type';
import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { User } from './user.entity';

@Entity()
export class EmailInfo extends BasicEntity {
  @Column({ type: 'varchar', nullable: true })
  confirmCode: string | null;

  @Column({ type: 'timestamp', nullable: true })
  codeExpirationDate: Date | null;

  @Column()
  isConfirmed: boolean;

  @Column({ type: 'timestamp', nullable: true })
  emailConfirmationCooldown: Date | null;

  @OneToOne(() => User, (u) => u.emailConfirmationInfo, { nullable: false })
  @JoinColumn({ name: 'userId' })
  user: User;
}
