import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CountryEntity } from './country.entity';

@Entity('cities')
export class CityEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @ManyToOne(() => CountryEntity, (country) => country.cities)
  @JoinColumn({ name: 'country_id' })
  country: CountryEntity;

  @Column({ name: 'country_id' })
  @Index('IDX_cities_country_id')
  countryId: number;
}
