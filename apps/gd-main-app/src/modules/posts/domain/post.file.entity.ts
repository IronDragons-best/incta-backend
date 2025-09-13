import { Column, Entity, Index, ManyToOne } from 'typeorm';

import { BasicEntity } from '../../../../core/common/types/basic.entity.type';

import { PostEntity } from './post.entity';

@Entity('post_files')
@Index(['post'])
export class PostFileEntity extends BasicEntity {
  @Column()
  @Index()
  fileName: string;

  @Column()
  fileUrl: string;

  @ManyToOne(() => PostEntity, post => post.files, { onDelete: 'CASCADE' })
  post: PostEntity;
}
