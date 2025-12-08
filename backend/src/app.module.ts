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
        host: configService.get<string>('DB_HOST'),
        port: parseInt(configService.get<string>('DB_PORT') || '5432', 10),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME', 'rfp_db'),
        entities: [Rfp, Vendor, Proposal, EmailRecord],
        synchronize: true,
        ssl: {
          rejectUnauthorized: false,
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
