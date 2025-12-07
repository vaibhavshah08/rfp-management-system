import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Rfp } from './rfp.entity';
import { Vendor } from './vendor.entity';

@Entity('proposals')
export class Proposal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  vendor_id: string;

  @Column('uuid')
  rfp_id: string;

  @Column('text')
  raw_email: string;

  @Column('jsonb')
  structured_proposal: {
    price?: number | null;
    items?: Array<{
      name: string;
      quantity: number;
      unit_price?: number | null;
      total_price?: number | null;
    }>;
    delivery_days?: number | null;
    warranty?: string | null;
    notes?: string | null;
    completeness?: number;
  };

  @Column('text', { nullable: true })
  ai_summary: string | null;

  @Column('float', { nullable: true })
  score: number | null;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => Vendor, (vendor) => vendor.proposals)
  @JoinColumn({ name: 'vendor_id' })
  vendor: Vendor;

  @ManyToOne(() => Rfp, (rfp) => rfp.proposals)
  @JoinColumn({ name: 'rfp_id' })
  rfp: Rfp;
}
