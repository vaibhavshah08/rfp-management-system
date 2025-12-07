import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailService } from './email.service';
import { EmailController } from './email.controller';
import { VendorModule } from '../vendor/vendor.module';
import { AiModule } from '../ai/ai.module';
import { Proposal } from '../database/entities/proposal.entity';
import { Rfp } from '../database/entities/rfp.entity';
import { Vendor } from '../database/entities/vendor.entity';
import { EmailRecord } from '../database/entities/email-record.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Proposal, Rfp, Vendor, EmailRecord]),
    VendorModule,
    forwardRef(() => AiModule),
  ],
  controllers: [EmailController],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}

