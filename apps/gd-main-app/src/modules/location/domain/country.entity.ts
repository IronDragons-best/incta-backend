import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { CityEntity } from './city.entity';

@Entity('countries')
export class CountryEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  name: string;

  @Column({ type: 'char', length: 2, unique: true })
  code: string;

  @OneToMany(() => CityEntity, (city) => city.country)
  cities: CityEntity[];
}
