import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Proposal } from '../database/entities/proposal.entity';
import { Rfp } from '../database/entities/rfp.entity';
import { Vendor } from '../database/entities/vendor.entity';
import { AiService } from '../ai/ai.service';

@Injectable()
export class ProposalService {
  constructor(
    @InjectRepository(Proposal)
    private proposalRepository: Repository<Proposal>,
    @InjectRepository(Rfp)
    private rfpRepository: Repository<Rfp>,
    @InjectRepository(Vendor)
    private vendorRepository: Repository<Vendor>,
    private aiService: AiService,
  ) {}

  async createFromEmail(
    vendorEmail: string,
    rfpId: string,
    emailBody: string,
  ): Promise<Proposal> {
    const vendor = await this.vendorRepository.findOne({
      where: { email: vendorEmail },
    });

    if (!vendor) {
      throw new NotFoundException(`Vendor with email ${vendorEmail} not found`);
    }

    const rfp = await this.rfpRepository.findOne({ where: { id: rfpId } });
    if (!rfp) {
      throw new NotFoundException(`RFP with ID ${rfpId} not found`);
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

  async findAll(): Promise<Proposal[]> {
    return this.proposalRepository.find({
      relations: ['vendor', 'rfp'],
      order: { created_at: 'DESC' },
    });
  }

  async findByRfpId(rfpId: string): Promise<Proposal[]> {
    return this.proposalRepository.find({
      where: { rfp_id: rfpId },
      relations: ['vendor', 'rfp'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Proposal> {
    const proposal = await this.proposalRepository.findOne({
      where: { id },
      relations: ['vendor', 'rfp'],
    });

    if (!proposal) {
      throw new NotFoundException(`Proposal with ID ${id} not found`);
    }

    return proposal;
  }

  async compareProposals(rfpId: string) {
    const proposals = await this.findByRfpId(rfpId);

    if (proposals.length === 0) {
      return {
        summary: 'No proposals found for this RFP',
        scores: {},
        recommended_vendor: null,
      };
    }

    const comparison_data = proposals.map((p) => ({
      id: p.id,
      vendor_id: p.vendor_id,
      vendor_name: p.vendor.name,
      vendor_email: p.vendor.email,
      structured_proposal: {
        price: p.structured_proposal.price ?? null,
        items: p.structured_proposal.items ?? [],
        delivery_days: p.structured_proposal.delivery_days ?? null,
        warranty: p.structured_proposal.warranty ?? null,
        notes: p.structured_proposal.notes ?? null,
        completeness: p.structured_proposal.completeness ?? 0,
      },
      score: p.score ?? undefined,
    }));

    const comparison = await this.aiService.compareProposals(comparison_data);

    for (const [vendor_id, score_data] of Object.entries(comparison.scores)) {
      const proposal = proposals.find((p) => p.vendor_id === vendor_id);
      if (proposal && score_data) {
        proposal.score = score_data.score;
        proposal.ai_summary = score_data.reasoning;
        await this.proposalRepository.save(proposal);
      }
    }

    return comparison;
  }

  async update(
    id: string,
    update_data: {
      structured_proposal?: any;
      ai_summary?: string;
      score?: number;
    },
  ): Promise<Proposal> {
    const proposal = await this.findOne(id);

    if (update_data.structured_proposal) {
      proposal.structured_proposal =
        update_data.structured_proposal as typeof proposal.structured_proposal;
    }
    if (update_data.ai_summary !== undefined) {
      proposal.ai_summary = update_data.ai_summary;
    }
    if (update_data.score !== undefined) {
      proposal.score = update_data.score;
    }

    return await this.proposalRepository.save(proposal);
  }
}
