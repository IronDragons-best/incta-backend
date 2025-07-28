import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';

import { BasicEntity } from '../../../../core/common/types/basic.entity.type';

import { PostFileEntity } from './post.file.entity';
import { User } from '../../users/domain/user.entity';
import { CreatePostInputDto } from '../interface/dto/input/create.post.input.dto';

export type PostDomainDtoType = {
  title: string;
  shortDescription: string;
  userId: number;
};

@Entity()
export class PostEntity extends BasicEntity {
  @Column()
  title: string;

  @Column()
  shortDescription: string;

  @ManyToOne(() => User, (u) => u.posts)
  @JoinColumn()
  user: User;

  @Column()
  userId: number;

  @OneToMany(() => PostFileEntity, (file) => file.post, { cascade: true })
  files: PostFileEntity[];

  static createInstance(data: PostDomainDtoType) {
    const post = new PostEntity();
    post.title = data.title;
    post.shortDescription = data.shortDescription;
    post.userId = data.userId;
    return post;
  }
}
