import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RfpService } from './rfp.service';
import { RfpController } from './rfp.controller';
import { Rfp } from '../database/entities/rfp.entity';
import { AiModule } from '../ai/ai.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Rfp]),
    AiModule,
    forwardRef(() => EmailModule),
  ],
  controllers: [RfpController],
  providers: [RfpService],
  exports: [RfpService],
})
export class RfpModule {}


