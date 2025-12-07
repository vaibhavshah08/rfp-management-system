import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
} from 'typeorm';
import { Proposal } from './proposal.entity';

@Entity('vendors')
export class Vendor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column('jsonb', { nullable: true })
  metadata: Record<string, any>;

  @OneToMany(() => Proposal, (proposal) => proposal.vendor)
  proposals: Proposal[];
}


