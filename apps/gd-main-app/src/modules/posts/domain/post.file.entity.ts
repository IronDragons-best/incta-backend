import { Column, Entity, ManyToOne } from 'typeorm';

import { BasicEntity } from '../../../../core/common/types/basic.entity.type';

import { PostEntity } from './post.entity';

@Entity('post_files')
export class PostFileEntity extends BasicEntity {
  @Column()
  fileName: string;

  @Column()
  fileUrl: string;

  @ManyToOne(() => PostEntity, post => post.files, { onDelete: 'CASCADE' })
  post: PostEntity;
}
