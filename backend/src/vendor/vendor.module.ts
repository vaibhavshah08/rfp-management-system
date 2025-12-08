import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VendorService } from './vendor.service';
import { VendorController } from './vendor.controller';
import { Vendor } from '../database/entities/vendor.entity';
import { Proposal } from '../database/entities/proposal.entity';
import { EmailRecord } from '../database/entities/email-record.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Vendor, Proposal, EmailRecord])],
  controllers: [VendorController],
  providers: [VendorService],
  exports: [VendorService],
})
export class VendorModule {}


