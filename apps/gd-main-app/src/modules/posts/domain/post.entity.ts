import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';

import { BasicEntity } from '../../../../core/common/types/basic.entity.type';

import { PostFileEntity } from './post.file.entity';
import { User } from '../../users/domain/user.entity';
import { PostViewDto } from '../interface/dto/output/post.view.dto';

export type PostDomainDtoType = {
  description: string;
  userId: number;
};

@Entity()
@Index(['userId', 'createdAt'])
export class PostEntity extends BasicEntity {
  @Column()
  description: string;

  @ManyToOne(() => User, (u) => u.posts, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @Column()
  @Index()
  userId: number;

  @OneToMany(() => PostFileEntity, (file) => file.post, { cascade: true })
  files: PostFileEntity[];

  static createInstance(data: PostDomainDtoType) {
    const post = new PostEntity();
    post.description = data.description;
    post.userId = data.userId;
    return post;
  }

  static mapToDomainDto(post: PostEntity): PostViewDto {
    return {
      id: post.id,
      user: {
        userId: post.user.id,
        username: post.user.username,
      },
      description: post.description,
      previewImages: post.files.map((file) => file.fileUrl),
      createdAt: post.createdAt,
    };
  }
  updateDescription(newDescription: string) {
    this.description = newDescription;
    return this;
  }
}
