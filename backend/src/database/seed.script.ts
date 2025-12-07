import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { Rfp } from './entities/rfp.entity';
import { Vendor } from './entities/vendor.entity';
import { Proposal } from './entities/proposal.entity';
import { seedDatabase } from './seed';

config();

const data_source = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'rfp_db',
  entities: [Rfp, Vendor, Proposal],
  synchronize: true,
});

data_source
  .initialize()
  .then(async () => {
    console.log('Database connection established');
    await seedDatabase(data_source);
    await data_source.destroy();
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error seeding database:', error);
    process.exit(1);
  });
