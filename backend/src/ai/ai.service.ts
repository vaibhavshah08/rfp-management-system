import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import {
  RfpStructureSchema,
  ProposalStructureSchema,
  ComparisonResultSchema,
  type RfpStructure,
  type ProposalStructure,
  type ComparisonResult,
} from './schemas/ai.schemas';
import { GENERATE_RFP_PROMPT } from './prompts/generate-rfp.prompt';
import { PARSE_PROPOSAL_PROMPT } from './prompts/parse-proposal.prompt';
import { COMPARE_PROPOSALS_PROMPT } from './prompts/compare-proposals.prompt';
import { GENERATE_EMAIL_SUBJECT_PROMPT } from './prompts/generate-email-subject.prompt';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly ai: GoogleGenAI;
  private readonly modelName: string;

  constructor(private configService: ConfigService) {
    const api_key = this.configService.get<string>('GEMINI_API_KEY');
    if (!api_key) {
      this.logger.warn('GEMINI_API_KEY not set. AI features will not work.');
    }
    this.ai = new GoogleGenAI({});
    this.modelName = this.configService.get<string>(
      'GEMINI_MODEL',
      'gemini-2.5-flash',
    );
  }

  async generateStructuredRfp(description: string): Promise<RfpStructure> {
    try {
      const prompt = `${GENERATE_RFP_PROMPT}\n\nUser description: ${description}\n\nReturn ONLY valid JSON, no other text.`;

      const response = await this.ai.models.generateContent({
        model: this.modelName,
        contents: prompt,
      });

      const content = response.text;
      if (!content) {
        throw new Error('No response from Gemini');
      }

      const json_match = content.match(/\{[\s\S]*\}/);
      const json_content = json_match ? json_match[0] : content;
      const parsed = JSON.parse(json_content);
      return RfpStructureSchema.parse(parsed);
    } catch (error) {
      this.logger.error('Error generating structured RFP', error);
      throw new Error(`Failed to generate structured RFP: ${error.message}`);
    }
  }

  async parseVendorEmail(emailBody: string): Promise<ProposalStructure> {
    try {
      const prompt = `${PARSE_PROPOSAL_PROMPT}\n\nEmail body:\n${emailBody}\n\nReturn ONLY valid JSON, no other text.`;

      const response = await this.ai.models.generateContent({
        model: this.modelName,
        contents: prompt,
      });

      const content = response.text;
      if (!content) {
        throw new Error('No response from Gemini');
      }

      const json_match = content.match(/\{[\s\S]*\}/);
      const json_content = json_match ? json_match[0] : content;
      const parsed = JSON.parse(json_content);
      return ProposalStructureSchema.parse(parsed);
    } catch (error) {
      this.logger.error('Error parsing vendor email', error);
      throw new Error(`Failed to parse vendor email: ${error.message}`);
    }
  }

  async compareProposals(
    proposals: Array<{
      id: string;
      vendor_id: string;
      vendor_name: string;
      vendor_email: string;
      structured_proposal: ProposalStructure;
      score?: number;
    }>,
  ): Promise<ComparisonResult> {
    try {
      const proposals_data = proposals.map((p) => ({
        id: p.id,
        vendorId: p.vendor_id,
        vendorName: p.vendor_name,
        vendorEmail: p.vendor_email,
        structured_proposal: p.structured_proposal,
        existing_score: p.score,
      }));

      const prompt = `${COMPARE_PROPOSALS_PROMPT}\n\nProposals data:\n${JSON.stringify(proposals_data, null, 2)}\n\nReturn ONLY valid JSON, no other text.`;

      const response = await this.ai.models.generateContent({
        model: this.modelName,
        contents: prompt,
      });

      const content = response.text;
      if (!content) {
        throw new Error('No response from Gemini');
      }

      const json_match = content.match(/\{[\s\S]*\}/);
      const json_content = json_match ? json_match[0] : content;
      const parsed = JSON.parse(json_content);
      return ComparisonResultSchema.parse(parsed);
    } catch (error) {
      this.logger.error('Error comparing proposals', error);
      throw new Error(`Failed to compare proposals: ${error.message}`);
    }
  }

  async generateEmailSubject(description: string): Promise<string> {
    try {
      const prompt = `${GENERATE_EMAIL_SUBJECT_PROMPT}\n\nRFP Description: ${description}\n\nReturn ONLY the subject line, no other text.`;

      const response = await this.ai.models.generateContent({
        model: this.modelName,
        contents: prompt,
      });

      const content = response.text;
      if (!content) {
        throw new Error('No response from Gemini');
      }

      const subject = content.trim().replace(/^["']|["']$/g, '');
      return subject || 'RFP Request';
    } catch (error) {
      this.logger.error('Error generating email subject', error);
      return 'RFP Request';
    }
  }
}
