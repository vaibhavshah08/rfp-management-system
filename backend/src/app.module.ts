import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RfpModule } from './rfp/rfp.module';
import { VendorModule } from './vendor/vendor.module';
import { ProposalModule } from './proposal/proposal.module';
import { EmailModule } from './email/email.module';
import { AiModule } from './ai/ai.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vendor } from './database/entities/vendor.entity';
import { Rfp } from './database/entities/rfp.entity';
import { Proposal } from './database/entities/proposal.entity';
import { EmailRecord } from './database/entities/email-record.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || ''),
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'rfp_db',
        entities: [Rfp, Vendor, Proposal, EmailRecord],
        synchronize: true,
        ssl: {
          rejectUnauthorized: false,
          ca: ``,
        },
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([Rfp, Vendor, Proposal, EmailRecord]),
    AiModule,
    RfpModule,
    VendorModule,
    ProposalModule,
    EmailModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
