import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';

export type UserDomainDtoType = {
  login: string;
  password: string;
  email: string;
};

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;
  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;
  @DeleteDateColumn()
  deletedAt: Date;
  @VersionColumn({ default: 1 })
  version: string;
  @Column()
  login: string;
  @Column()
  password: string;
  @Column()
  email: string;

  static createInstance(userDto: UserDomainDtoType) {
    const user = new this();
    user.login = userDto.login;
    user.email = userDto.email;
    user.password = userDto.password;
    return user;
  }
}
