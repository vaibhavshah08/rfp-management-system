import { DataSource } from 'typeorm';
import { Rfp } from './entities/rfp.entity';
import { Vendor } from './entities/vendor.entity';
import { Proposal } from './entities/proposal.entity';

export async function seedDatabase(dataSource: DataSource) {
  const rfp_repository = dataSource.getRepository(Rfp);
  const vendor_repository = dataSource.getRepository(Vendor);
  const proposal_repository = dataSource.getRepository(Proposal);

  await proposal_repository.delete({});
  await rfp_repository.delete({});
  await vendor_repository.delete({});

  const vendor1 = vendor_repository.create({
    name: 'Tech Solutions Inc.',
    email: 'vendor1@techsolutions.com',
    metadata: { industry: 'Technology', rating: 4.5 },
  });

  const vendor2 = vendor_repository.create({
    name: 'Global Supplies Co.',
    email: 'vendor2@globalsupplies.com',
    metadata: { industry: 'Manufacturing', rating: 4.2 },
  });

  const vendor3 = vendor_repository.create({
    name: 'Premium Services Ltd.',
    email: 'vendor3@premiumservices.com',
    metadata: { industry: 'Services', rating: 4.8 },
  });

  const vendors = await vendor_repository.save([vendor1, vendor2, vendor3]);
  console.log('Created vendors:', vendors.length);

  const rfp = rfp_repository.create({
    description_raw:
      'I need 100 laptops with 16GB RAM, Intel i7 processor, SSD storage. Delivery within 30 days. Budget: $50,000. Payment terms: Net 30. Warranty: 2 years.',
    structured_data: {
      budget: 50000,
      items: [
        {
          name: 'Laptop',
          quantity: 100,
          specifications: '16GB RAM, Intel i7 processor, SSD storage',
        },
      ],
      quantities: { Laptop: 100 },
      delivery_timeline: '30 days',
      payment_terms: 'Net 30',
      warranty: '2 years',
      category: 'IT Equipment',
    },
  });

  const saved_rfp = await rfp_repository.save(rfp);
  console.log('Created RFP:', saved_rfp.id);

  const proposal1 = proposal_repository.create({
    vendor_id: vendors[0].id,
    rfp_id: saved_rfp.id,
    raw_email:
      'We can provide 100 laptops at $480 per unit. Total: $48,000. Delivery: 25 days. Warranty: 2 years.',
    structured_proposal: {
      price: 48000,
      items: [
        {
          name: 'Laptop',
          quantity: 100,
          unit_price: 480,
          total_price: 48000,
        },
      ],
      delivery_days: 25,
      warranty: '2 years',
      notes: 'Bulk discount applied',
      completeness: 95,
    },
    ai_summary: 'Competitive pricing with good delivery timeline',
    score: 85,
  });

  const proposal2 = proposal_repository.create({
    vendor_id: vendors[1].id,
    rfp_id: saved_rfp.id,
    raw_email:
      'Our quote: $52,000 for 100 laptops. Delivery: 28 days. Warranty: 3 years.',
    structured_proposal: {
      price: 52000,
      items: [
        {
          name: 'Laptop',
          quantity: 100,
          unit_price: 520,
          total_price: 52000,
        },
      ],
      delivery_days: 28,
      warranty: '3 years',
      notes: 'Extended warranty included',
      completeness: 90,
    },
    ai_summary: 'Higher price but extended warranty',
    score: 75,
  });

  await proposal_repository.save([proposal1, proposal2]);
  console.log('Created proposals:', 2);

  console.log('Database seeded successfully!');
}
