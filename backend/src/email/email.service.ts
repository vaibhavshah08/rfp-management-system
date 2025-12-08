import {
  Injectable,
  Logger,
  OnModuleInit,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as nodemailer from 'nodemailer';
import { ImapFlow } from 'imapflow';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Rfp } from '../database/entities/rfp.entity';
import { Vendor } from '../database/entities/vendor.entity';
import { Proposal } from '../database/entities/proposal.entity';
import { EmailRecord } from '../database/entities/email-record.entity';
import { VendorService } from '../vendor/vendor.service';
import { AiService } from '../ai/ai.service';
import { RfpService } from '../rfp/rfp.service';

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;
  private imapClient: ImapFlow | null = null;

  constructor(
    private configService: ConfigService,
    private vendorService: VendorService,
    @Inject(forwardRef(() => AiService))
    private aiService: AiService,
    @Inject(forwardRef(() => RfpService))
    private rfpService: RfpService,
    @InjectRepository(Proposal)
    private proposalRepository: Repository<Proposal>,
    @InjectRepository(Rfp)
    private rfpRepository: Repository<Rfp>,
    @InjectRepository(Vendor)
    private vendorRepository: Repository<Vendor>,
    @InjectRepository(EmailRecord)
    private emailRecordRepository: Repository<EmailRecord>,
  ) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST', 'smtp.gmail.com'),
      port: this.configService.get<number>('SMTP_PORT', 587),
      secure: false,
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });
  }

  async onModuleInit() {
    await this.setupImapListener();
  }

  async sendRfpToVendors(
    rfp: Rfp,
    vendor_ids: string[],
  ): Promise<Array<{ vendor_id: string; success: boolean; message: string }>> {
    const vendors = await Promise.all(
      vendor_ids.map((id) => this.vendorService.findOne(id)),
    );

    const results = await Promise.allSettled(
      vendors.map((vendor) =>
        this.sendRfpEmail(rfp, vendor.email, vendor.name, vendor.id),
      ),
    );

    const success_count = results.filter(
      (r) => r.status === 'fulfilled',
    ).length;

    if (success_count > 0 && rfp.is_draft) {
      await this.rfpService.markDraftAsSent(rfp.id);
    }

    return results.map((result, index) => {
      const vendor = vendors[index];
      if (result.status === 'fulfilled') {
        return {
          vendor_id: vendor.id,
          success: true,
          message: `Email sent successfully to ${vendor.email}`,
        };
      } else {
        return {
          vendor_id: vendor.id,
          success: false,
          message: `Failed to send email to ${vendor.email}: ${result.reason?.message || 'Unknown error'}`,
        };
      }
    });
  }

  private async sendRfpEmail(
    rfp: Rfp,
    vendorEmail: string,
    vendorName: string,
    vendor_id: string,
  ): Promise<void> {
    const email_html = await this.generateRfpEmailTemplate(rfp, vendorName);
    const email_text = this.generateRfpEmailText(rfp);
    const subject = await this.aiService.generateEmailSubject(
      rfp.description_raw,
    );

    const email_record = this.emailRecordRepository.create({
      rfp_id: rfp.id,
      vendor_id: vendor_id,
      recipient_email: vendorEmail,
      subject: subject,
      email_body: email_html,
      status: 'pending',
    });
    await this.emailRecordRepository.save(email_record);

    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>('SMTP_FROM', 'rfp@example.com'),
        to: vendorEmail,
        subject: subject,
        html: email_html,
        text: email_text,
      });

      email_record.status = 'sent';
      email_record.sent_at = new Date();
      await this.emailRecordRepository.save(email_record);

      this.logger.log(`RFP email sent to ${vendorEmail}`);
    } catch (error) {
      email_record.status = 'failed';
      email_record.error_message = error.message;
      await this.emailRecordRepository.save(email_record);

      this.logger.error(`Failed to send email to ${vendorEmail}`, error);
      throw error;
    }
  }

  private formatMoney(amount: number, currency?: string | null): string {
    if (amount === null || amount === undefined) return 'N/A';
    const safe_currency = currency || 'USD';
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: safe_currency,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      return `${currency ? currency + ' ' : ''}${amount.toLocaleString()}`;
    }
  }

  private async generateRfpEmailTemplate(
    rfp: Rfp,
    vendorName: string,
  ): Promise<string> {
    const { structured_data } = rfp;
    const template_path = 'src/email/templates/rfp-email.template.html';
    let template = readFileSync(join(process.cwd(), template_path), 'utf-8');

    template = template.replace('{{VENDOR_NAME}}', vendorName);
    template = template.replace('{{RFP_ID}}', rfp.id);

    const budget_section =
      structured_data.budget !== null && structured_data.budget !== undefined
        ? `<div class="section">
          <h3>Budget</h3>
          <p>${this.formatMoney(
            structured_data.budget,
            structured_data.budget_currency,
          )}</p>
          ${
            structured_data.budget_per_unit
              ? `<p><strong>Budget per unit:</strong> ${this.formatMoney(
                  structured_data.budget_per_unit,
                  structured_data.budget_currency,
                )}</p>`
              : ''
          }
        </div>`
        : '';

    const items_section =
      structured_data.items && structured_data.items.length > 0
        ? `<div class="section">
            <h3>Items Required</h3>
            ${structured_data.items
              .map(
                (item) => `
              <div class="item">
                <strong>Item:</strong> ${item.name}<br>
                <strong>Requirement:</strong> ${item.specifications || 'N/A'}<br>
                <strong>Quantity:</strong> ${item.quantity}
              </div>
            `,
              )
              .join('')}
          </div>`
        : '';

    const delivery_timeline_section = structured_data.delivery_timeline
      ? `<div class="section">
          <h3>Delivery Timeline</h3>
          <p>${structured_data.delivery_timeline}</p>
        </div>`
      : '';

    const payment_terms_section = structured_data.payment_terms
      ? `<div class="section">
          <h3>Payment Expectations</h3>
          <p>${structured_data.payment_terms}</p>
        </div>`
      : '';

    const warranty_section = structured_data.warranty
      ? `<div class="section">
          <h3>Warranty Requirements</h3>
          <p>${structured_data.warranty}</p>
        </div>`
      : '';

    let special_requests_section = '';
    if (structured_data.special_requests) {
      const rephrased_requests = await this.aiService.rephraseSpecialRequests(
        structured_data.special_requests,
      );
      special_requests_section = `<div class="section">
          <h3>Special Requests</h3>
          <p>${rephrased_requests}</p>
        </div>`;
    }

    template = template.replace('{{BUDGET_SECTION}}', budget_section);
    template = template.replace('{{ITEMS_SECTION}}', items_section);
    template = template.replace(
      '{{DELIVERY_TIMELINE_SECTION}}',
      delivery_timeline_section,
    );
    template = template.replace(
      '{{PAYMENT_TERMS_SECTION}}',
      payment_terms_section,
    );
    template = template.replace('{{WARRANTY_SECTION}}', warranty_section);
    template = template.replace(
      '{{SPECIAL_REQUESTS_SECTION}}',
      special_requests_section,
    );

    return template;
  }

  async generateEmailPreview(rfp: Rfp): Promise<{
    html: string;
    text: string;
    subject: string;
  }> {
    const html = await this.generateRfpEmailTemplate(rfp, 'Vendor Name');
    const text = this.generateRfpEmailText(rfp);
    const subject = await this.aiService.generateEmailSubject(
      rfp.description_raw,
    );
    return { html, text, subject };
  }

  private generateRfpEmailText(rfp: Rfp): string {
    const { structured_data } = rfp;
    let text = `Request for Proposal (RFP)\n\n`;

    if (structured_data.budget) {
      text += `Budget: ${this.formatMoney(
        structured_data.budget,
        structured_data.budget_currency,
      )}\n`;
      if (structured_data.budget_per_unit) {
        text += `Budget per unit: ${this.formatMoney(
          structured_data.budget_per_unit,
          structured_data.budget_currency,
        )}\n`;
      }
      text += `\n`;
    }

    if (structured_data.items && structured_data.items.length > 0) {
      text += `Items Required:\n`;
      structured_data.items.forEach((item) => {
        text += `- ${item.name} (Quantity: ${item.quantity})\n`;
        if (item.specifications) {
          text += `  Specifications: ${item.specifications}\n`;
        }
      });
      text += `\n`;
    }

    if (structured_data.delivery_timeline) {
      text += `Delivery Timeline: ${structured_data.delivery_timeline}\n\n`;
    }

    if (structured_data.payment_terms) {
      text += `Payment Terms: ${structured_data.payment_terms}\n\n`;
    }

    if (structured_data.warranty) {
      text += `Warranty Requirements: ${structured_data.warranty}\n\n`;
    }

    text += `\nPlease reply to this email with your proposal.\n`;
    text += `RFP ID: ${rfp.id}\n`;

    return text;
  }

  private async setupImapListener(): Promise<void> {
    const imap_host = this.configService.get<string>('IMAP_HOST');
    const imap_user = this.configService.get<string>('IMAP_USER');
    const imap_pass = this.configService.get<string>('IMAP_PASS');

    if (!imap_host || !imap_user || !imap_pass) {
      this.logger.warn(
        'IMAP credentials not configured. Email listener disabled.',
      );
      return;
    }

    try {
      this.imapClient = new ImapFlow({
        host: imap_host,
        port: this.configService.get<number>('IMAP_PORT', 993),
        secure: true,
        auth: {
          user: imap_user,
          pass: imap_pass,
        },
      });

      await this.imapClient.connect();
      this.logger.log('IMAP client connected');

      this.startEmailListener();
    } catch (error) {
      this.logger.error('Failed to setup IMAP listener', error);
    }
  }

  private async startEmailListener(): Promise<void> {
    if (!this.imapClient) return;

    try {
      const lock = await this.imapClient.getMailboxLock('INBOX');
      try {
        setInterval(async () => {
          await this.checkForNewEmails();
        }, 60000);

        await this.checkForNewEmails();
      } finally {
        lock.release();
      }
    } catch (error) {
      this.logger.error('Error in email listener', error);
    }
  }

  async checkForNewEmailsManually(): Promise<{
    success: boolean;
    message: string;
    processed: number;
  }> {
    if (!this.imapClient) {
      return {
        success: false,
        message: 'IMAP client not initialized. Check IMAP configuration.',
        processed: 0,
      };
    }

    let processed_count = 0;
    try {
      const lock = await this.imapClient.getMailboxLock('INBOX');
      try {
        const messages = await this.imapClient.search({
          seen: false,
        });

        if (Array.isArray(messages)) {
          for (const seq of messages) {
            const message = await this.imapClient.fetchOne(seq.toString(), {
              source: true,
              bodyStructure: true,
            });

            if (message && message.source) {
              try {
                await this.processIncomingEmail(message.source.toString());
                await this.imapClient.messageFlagsAdd(seq.toString(), [
                  '\\Seen',
                ]);
                processed_count++;
              } catch (error) {
                this.logger.error(`Error processing email ${seq}`, error);
              }
            }
          }
        }
      } finally {
        lock.release();
      }

      return {
        success: true,
        message: `Checked for new emails. Processed ${processed_count} new proposal(s).`,
        processed: processed_count,
      };
    } catch (error) {
      this.logger.error('Error checking for new emails', error);
      return {
        success: false,
        message: `Error checking emails: ${error.message}`,
        processed: processed_count,
      };
    }
  }

  private async checkForNewEmails(): Promise<void> {
    if (!this.imapClient) return;

    try {
      const lock = await this.imapClient.getMailboxLock('INBOX');
      try {
        const messages = await this.imapClient.search({
          seen: false,
        });

        if (Array.isArray(messages)) {
          for (const seq of messages) {
            const message = await this.imapClient.fetchOne(seq.toString(), {
              source: true,
              bodyStructure: true,
            });

            if (message && message.source) {
              await this.processIncomingEmail(message.source.toString());
              await this.imapClient.messageFlagsAdd(seq.toString(), ['\\Seen']);
            }
          }
        }
      } finally {
        lock.release();
      }
    } catch (error) {
      this.logger.error('Error checking for new emails', error);
    }
  }

  private async processIncomingEmail(emailContent: string): Promise<void> {
    try {
      const email_body = this.extractEmailBody(emailContent);
      const from_email = this.extractFromEmail(emailContent);
      const email_subject = this.extractSubject(emailContent);

      if (!from_email) {
        this.logger.warn('Could not extract vendor email from email');
        return;
      }

      let rfp_id = this.extractRfpIdFromEmail(emailContent);

      if (!rfp_id) {
        this.logger.log(
          `RFP ID not found directly, trying context-based matching for ${from_email}`,
        );
        rfp_id = await this.findRfpByEmailContext(
          from_email,
          email_subject,
          email_body,
        );
      }

      if (!rfp_id) {
        this.logger.warn(
          `Could not determine RFP ID for email from ${from_email}. Subject: ${email_subject}. Manual linking may be required.`,
        );
        return;
      }

      await this.createProposalFromEmail(from_email, rfp_id, email_body);
      this.logger.log(
        `Processed proposal from ${from_email} for RFP ${rfp_id}`,
      );
    } catch (error) {
      this.logger.error('Error processing incoming email', error);
    }
  }

  private extractSubject(emailContent: string): string {
    const subject_match = emailContent.match(/Subject:\s*(.+)/i);
    return subject_match ? subject_match[1].trim() : '';
  }

  private extractEmailBody(emailContent: string): string {
    const body_match = emailContent.match(
      /Content-Type: text\/plain;[\s\S]*?\n\n([\s\S]*?)(?=\n--|\nContent-Type:|$)/,
    );
    if (body_match) {
      return body_match[1].trim();
    }
    return emailContent;
  }

  private extractFromEmail(emailContent: string): string | null {
    const from_match = emailContent.match(
      /From:.*?<([^>]+)>|From:\s*([^\s<]+)/,
    );
    return from_match ? (from_match[1] || from_match[2]).trim() : null;
  }

  private extractRfpIdFromEmail(emailContent: string): string | null {
    const explicit_match = emailContent.match(/RFP\s*ID[:\s]+([a-f0-9-]{36})/i);
    if (explicit_match) {
      return explicit_match[1];
    }

    const subject_match = emailContent.match(
      /Subject:[^\n]*\[([a-f0-9-]{36})\]/i,
    );
    if (subject_match) {
      return subject_match[1];
    }

    const subject_uuid_match = emailContent.match(
      /Subject:[^\n]*([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i,
    );
    if (subject_uuid_match) {
      return subject_uuid_match[1];
    }

    const in_reply_to_match = emailContent.match(/In-Reply-To:\s*<([^>]+)>/i);
    if (in_reply_to_match) {
    }

    const body_uuid_match = emailContent.match(
      /([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i,
    );
    if (body_uuid_match) {
      return body_uuid_match[1];
    }

    return null;
  }

  private async findRfpByEmailContext(
    vendorEmail: string,
    emailSubject: string,
    emailBody: string,
  ): Promise<string | null> {
    try {
      const vendor = await this.vendorRepository.findOne({
        where: { email: vendorEmail },
      });

      if (!vendor) {
        return null;
      }

      const recent_date = new Date();
      recent_date.setDate(recent_date.getDate() - 30);

      const email_records = await this.emailRecordRepository
        .createQueryBuilder('emailRecord')
        .leftJoinAndSelect('emailRecord.rfp', 'rfp')
        .where('emailRecord.vendor_id = :vendorId', { vendorId: vendor.id })
        .andWhere('emailRecord.status = :status', { status: 'sent' })
        .andWhere('emailRecord.sent_at >= :recentDate', {
          recentDate: recent_date,
        })
        .orderBy('emailRecord.sent_at', 'DESC')
        .take(10)
        .getMany();

      const subject_keywords = emailSubject.toLowerCase().split(/\s+/);
      for (const record of email_records) {
        const rfp = record.rfp;
        if (!rfp) continue;

        const rfp_category = rfp.structured_data.category?.toLowerCase() || '';
        const rfp_description = rfp.description_raw.toLowerCase();

        const match_score = subject_keywords.filter(
          (keyword) =>
            rfp_category.includes(keyword) || rfp_description.includes(keyword),
        ).length;

        if (match_score >= 2) {
          return rfp.id;
        }
      }

      if (email_records.length > 0 && email_records[0].rfp) {
        return email_records[0].rfp.id;
      }
    } catch (error) {
      this.logger.error('Error finding RFP by email context', error);
    }

    return null;
  }

  private async createProposalFromEmail(
    vendorEmail: string,
    rfpId: string,
    emailBody: string,
  ): Promise<Proposal> {
    const vendor = await this.vendorRepository.findOne({
      where: { email: vendorEmail },
    });

    if (!vendor) {
      this.logger.warn(`Vendor with email ${vendorEmail} not found`);
      throw new Error(`Vendor with email ${vendorEmail} not found`);
    }

    const rfp = await this.rfpRepository.findOne({ where: { id: rfpId } });
    if (!rfp) {
      this.logger.warn(`RFP with ID ${rfpId} not found`);
      throw new Error(`RFP with ID ${rfpId} not found`);
    }

    const structured_proposal =
      await this.aiService.parseVendorEmail(emailBody);

    const proposal = this.proposalRepository.create({
      vendor_id: vendor.id,
      rfp_id: rfp.id,
      raw_email: emailBody,
      structured_proposal: structured_proposal,
      ai_summary: null,
      score: structured_proposal.completeness ?? null,
    } as Partial<Proposal>);

    return await this.proposalRepository.save(proposal);
  }

  async getSentEmails() {
    return this.emailRecordRepository.find({
      relations: ['rfp', 'vendor'],
      order: { created_at: 'DESC' },
    });
  }

  async getSentEmailsForRfp(rfpId: string) {
    return this.emailRecordRepository.find({
      where: { rfp_id: rfpId },
      relations: ['rfp', 'vendor'],
      order: { created_at: 'DESC' },
    });
  }
}
