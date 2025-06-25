import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class Post {
  @PrimaryColumn('uuid')
  id: string;
  @Column()
  title: string;
  @Column()
  shortDescription: string;
  @Column()
  content: string;
}
