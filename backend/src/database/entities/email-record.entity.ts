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

@Entity('email_records')
export class EmailRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  rfp_id: string;

  @Column('uuid')
  vendor_id: string;

  @Column()
  recipient_email: string;

  @Column()
  subject: string;

  @Column('text')
  email_body: string;

  @Column({ default: 'pending' })
  status: 'pending' | 'sent' | 'failed';

  @Column('text', { nullable: true })
  error_message: string | null;

  @Column('timestamp', { nullable: true, name: 'sent_at' })
  sent_at: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  created_at: Date;

  @ManyToOne(() => Rfp)
  @JoinColumn({ name: 'rfp_id' })
  rfp: Rfp;

  @ManyToOne(() => Vendor)
  @JoinColumn({ name: 'vendor_id' })
  vendor: Vendor;
}
