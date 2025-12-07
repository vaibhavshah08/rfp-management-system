import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Proposal } from './proposal.entity';

@Entity('rfps')
export class Rfp {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  description_raw: string;

  @Column('jsonb')
  structured_data: {
    budget?: number | null;
    items?: Array<{
      name: string;
      quantity: number;
      specifications?: string | null;
    }>;
    quantities?: Record<string, number>;
    delivery_timeline?: string | null;
    payment_terms?: string | null;
    warranty?: string | null;
    category?: string | null;
    metadata?: Record<string, any> | null;
  };

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @OneToMany(() => Proposal, (proposal) => proposal.rfp)
  proposals: Proposal[];
}


