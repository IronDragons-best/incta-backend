import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIndexToCitiesAndSeedData1754720000000 implements MigrationInterface {
  name = 'AddIndexToCitiesAndSeedData1754720000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX "IDX_cities_country_id" ON "cities" ("country_id")`,
    );

    await queryRunner.query(`
      INSERT INTO "countries" ("name", "code") VALUES 
      ('Germany', 'DE'),
      ('Russia', 'RU'),
      ('Ukraine', 'UA'),
      ('Belarus', 'BY'),
      ('United Kingdom', 'GB'),
      ('United States', 'US'),
      ('France', 'FR'),
      ('Italy', 'IT'),
      ('Spain', 'ES'),
      ('Poland', 'PL')
    `);

    await queryRunner.query(`
      INSERT INTO "cities" ("name", "country_id") VALUES 
      ('Berlin', 1),
      ('Munich', 1),
      ('Hamburg', 1),
      ('Cologne', 1),
      ('Frankfurt', 1),
      ('Stuttgart', 1),
      ('Düsseldorf', 1),
      ('Dortmund', 1),
      ('Essen', 1),
      ('Leipzig', 1)
    `);

    await queryRunner.query(`
      INSERT INTO "cities" ("name", "country_id") VALUES 
      ('Moscow', 2),
      ('Saint Petersburg', 2),
      ('Novosibirsk', 2),
      ('Yekaterinburg', 2),
      ('Nizhniy Novgorod', 2),
      ('Kazan', 2),
      ('Chelyabinsk', 2),
      ('Omsk', 2),
      ('Samara', 2),
      ('Rostov-on-Don', 2)
    `);

    await queryRunner.query(`
      INSERT INTO "cities" ("name", "country_id") VALUES 
      ('Kiev', 3),
      ('Kharkiv', 3),
      ('Dnipro', 3),
      ('Odessa', 3),
      ('Donetsk', 3),
      ('Zaporizhzhia', 3),
      ('Lviv', 3),
      ('Kryvyi Rih', 3),
      ('Mykolaiv', 3),
      ('Mariupol', 3)
    `);

    await queryRunner.query(`
      INSERT INTO "cities" ("name", "country_id") VALUES 
      ('Minsk', 4),
      ('Gomel', 4),
      ('Mogilev', 4),
      ('Vitebsk', 4),
      ('Grodno', 4),
      ('Brest', 4),
      ('Bobruisk', 4),
      ('Baranovichi', 4),
      ('Borisov', 4),
      ('Pinsk', 4)
    `);

    await queryRunner.query(`
      INSERT INTO "cities" ("name", "country_id") VALUES 
      ('London', 5),
      ('Birmingham', 5),
      ('Manchester', 5),
      ('Glasgow', 5),
      ('Liverpool', 5),
      ('Edinburgh', 5),
      ('Leeds', 5),
      ('Sheffield', 5),
      ('Bristol', 5),
      ('Cardiff', 5)
    `);

    await queryRunner.query(`
      INSERT INTO "cities" ("name", "country_id") VALUES 
      ('New York', 6),
      ('Los Angeles', 6),
      ('Chicago', 6),
      ('Houston', 6),
      ('Phoenix', 6),
      ('Philadelphia', 6),
      ('San Antonio', 6),
      ('San Diego', 6),
      ('Dallas', 6),
      ('San Jose', 6)
    `);

    await queryRunner.query(`
      INSERT INTO "cities" ("name", "country_id") VALUES 
      ('Paris', 7),
      ('Marseille', 7),
      ('Lyon', 7),
      ('Toulouse', 7),
      ('Nice', 7),
      ('Nantes', 7),
      ('Montpellier', 7),
      ('Strasbourg', 7),
      ('Bordeaux', 7),
      ('Lille', 7)
    `);

    await queryRunner.query(`
      INSERT INTO "cities" ("name", "country_id") VALUES 
      ('Rome', 8),
      ('Milan', 8),
      ('Naples', 8),
      ('Turin', 8),
      ('Palermo', 8),
      ('Genoa', 8),
      ('Bologna', 8),
      ('Florence', 8),
      ('Bari', 8),
      ('Catania', 8)
    `);

    await queryRunner.query(`
      INSERT INTO "cities" ("name", "country_id") VALUES 
      ('Madrid', 9),
      ('Barcelona', 9),
      ('Valencia', 9),
      ('Seville', 9),
      ('Zaragoza', 9),
      ('Málaga', 9),
      ('Murcia', 9),
      ('Palma', 9),
      ('Las Palmas', 9),
      ('Bilbao', 9)
    `);

    await queryRunner.query(`
      INSERT INTO "cities" ("name", "country_id") VALUES 
      ('Warsaw', 10),
      ('Krakow', 10),
      ('Lodz', 10),
      ('Wroclaw', 10),
      ('Poznan', 10),
      ('Gdansk', 10),
      ('Szczecin', 10),
      ('Bydgoszcz', 10),
      ('Lublin', 10),
      ('Katowice', 10)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "cities"`);

    await queryRunner.query(`DELETE FROM "countries"`);

    await queryRunner.query(`DROP INDEX "public"."IDX_cities_country_id"`);
  }
}
