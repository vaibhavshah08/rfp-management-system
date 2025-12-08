import { DataSource } from 'typeorm';
import { Rfp } from './entities/rfp.entity';
import { Vendor } from './entities/vendor.entity';
import { Proposal } from './entities/proposal.entity';

export async function seedDatabase(dataSource: DataSource) {
  const rfp_repository = dataSource.getRepository(Rfp);
  const vendor_repository = dataSource.getRepository(Vendor);
  const proposal_repository = dataSource.getRepository(Proposal);

  const vendor1 = vendor_repository.create({
    name: 'Tech Solutions Inc.',
    email: 'vendor1@techsolutions.com', // replace with a valid email
    metadata: { industry: 'Technology', rating: 4.5 },
  });

  const vendor2 = vendor_repository.create({
    name: 'Global Supplies Co.',
    email: 'vendor2@globalsupplies.com', // replace with a valid email
    metadata: { industry: 'Manufacturing', rating: 4.2 },
  });

  const vendor3 = vendor_repository.create({
    name: 'Premium Services Ltd.',
    email: 'vendor3@premiumservices.com',
    metadata: { industry: 'Services', rating: 4.8 },
  });

  const vendors = await vendor_repository.save([vendor1, vendor2, vendor3]);
  console.log('Created vendors:', vendors.length);

  console.log('Database seeded successfully!');
}
