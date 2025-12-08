import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rfp } from '../database/entities/rfp.entity';
import { CreateRfpDto } from './dto/create-rfp.dto';
import { UpdateRfpDto } from './dto/update-rfp.dto';
import { AiService } from '../ai/ai.service';

@Injectable()
export class RfpService {
  constructor(
    @InjectRepository(Rfp)
    private rfpRepository: Repository<Rfp>,
    private aiService: AiService,
  ) {}

  async create(createRfpDto: CreateRfpDto, is_draft: boolean = false): Promise<Rfp> {
    const description = createRfpDto.description.trim();
    
    if (!description) {
      throw new BadRequestException('Description cannot be empty');
    }

    let structured_data;
    if (is_draft) {
      structured_data = {
        budget: null,
        budget_currency: null,
        budget_per_unit: null,
        items: [],
        quantities: {},
        delivery_timeline: null,
        payment_terms: null,
        warranty: null,
        special_requests: null,
        category: null,
        metadata: {},
      };
    } else {
      structured_data = await this.aiService.generateStructuredRfp(description);

      const is_valid = this.validateStructuredData(structured_data);
      
      if (!is_valid) {
        throw new BadRequestException(
          'The description provided is not detailed enough to create a valid RFP. Please provide more specific information including: items/products needed, quantities, budget, delivery timeline, payment terms, or warranty requirements.',
        );
      }
    }

    const rfp = this.rfpRepository.create({
      description_raw: description,
      structured_data: structured_data,
      is_draft: is_draft,
    });

    return this.rfpRepository.save(rfp);
  }

  private validateStructuredData(structured_data: any): boolean {
    if (structured_data.budget !== null && structured_data.budget !== undefined) {
      return true;
    }

    if (structured_data.items && Array.isArray(structured_data.items) && structured_data.items.length > 0) {
      const has_valid_item = structured_data.items.some(
        (item: any) => item && item.name && item.name.trim().length > 0,
      );
      if (has_valid_item) {
        return true;
      }
    }

    if (structured_data.quantities && typeof structured_data.quantities === 'object') {
      const quantity_keys = Object.keys(structured_data.quantities).filter(
        (key) => structured_data.quantities[key] !== null && structured_data.quantities[key] !== undefined,
      );
      if (quantity_keys.length > 0) {
        return true;
      }
    }

    if (
      (structured_data.delivery_timeline && structured_data.delivery_timeline.trim().length > 0) ||
      (structured_data.payment_terms && structured_data.payment_terms.trim().length > 0) ||
      (structured_data.warranty && structured_data.warranty.trim().length > 0) ||
      (structured_data.category && structured_data.category.trim().length > 0)
    ) {
      return true;
    }

    return false;
  }

  async findAll(): Promise<Rfp[]> {
    return this.rfpRepository.find({
      where: { is_draft: false },
      relations: ['proposals', 'proposals.vendor'],
      order: { created_at: 'DESC' },
    });
  }

  async findAllDrafts(): Promise<Rfp[]> {
    return this.rfpRepository.find({
      where: { is_draft: true },
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Rfp> {
    const rfp = await this.rfpRepository.findOne({
      where: { id },
      relations: ['proposals', 'proposals.vendor'],
    });

    if (!rfp) {
      throw new NotFoundException(`RFP with ID ${id} not found`);
    }

    return rfp;
  }

  async update(id: string, updateRfpDto: UpdateRfpDto, is_draft: boolean | null = null): Promise<Rfp> {
    const rfp = await this.rfpRepository.findOne({ where: { id } });

    if (!rfp) {
      throw new NotFoundException(`RFP with ID ${id} not found`);
    }

    if (updateRfpDto.description !== undefined) {
      const description = updateRfpDto.description.trim();
      
      if (!description) {
        throw new BadRequestException('Description cannot be empty');
      }

      const has_existing_structured_data = rfp.structured_data && (
        (rfp.structured_data.budget !== null && rfp.structured_data.budget !== undefined) ||
        (rfp.structured_data.items && Array.isArray(rfp.structured_data.items) && rfp.structured_data.items.length > 0) ||
        (rfp.structured_data.delivery_timeline && rfp.structured_data.delivery_timeline.trim().length > 0) ||
        (rfp.structured_data.payment_terms && rfp.structured_data.payment_terms.trim().length > 0) ||
        (rfp.structured_data.warranty && rfp.structured_data.warranty.trim().length > 0)
      );

      if (rfp.is_draft && has_existing_structured_data) {
        const structured_data = await this.aiService.generateStructuredRfp(description);
        
        const is_valid = this.validateStructuredData(structured_data);
        
        if (!is_valid) {
          throw new BadRequestException(
            'The description provided is not detailed enough to create a valid RFP. Please provide more specific information including: items/products needed, quantities, budget, delivery timeline, payment terms, or warranty requirements.',
          );
        }

        const existing_metadata = rfp.structured_data?.metadata || {};
        
        rfp.description_raw = description;
        rfp.structured_data = {
          ...structured_data,
          metadata: existing_metadata,
        } as typeof rfp.structured_data;
        
        if (updateRfpDto.selected_vendors !== undefined) {
          if (!rfp.structured_data.metadata) {
            rfp.structured_data.metadata = {};
          }
          rfp.structured_data.metadata.selected_vendors = updateRfpDto.selected_vendors;
        }
      } else if (rfp.is_draft || is_draft === true) {
        rfp.description_raw = description;
        
        if (updateRfpDto.selected_vendors !== undefined) {
          if (!rfp.structured_data.metadata) {
            rfp.structured_data.metadata = {};
          }
          rfp.structured_data.metadata.selected_vendors = updateRfpDto.selected_vendors;
        }
      } else {
        const structured_data = await this.aiService.generateStructuredRfp(description);
        
        const is_valid = this.validateStructuredData(structured_data);
        
        if (!is_valid) {
          throw new BadRequestException(
            'The description provided is not detailed enough to create a valid RFP. Please provide more specific information including: items/products needed, quantities, budget, delivery timeline, payment terms, or warranty requirements.',
          );
        }

        const existing_metadata = rfp.structured_data?.metadata || {};
        
        rfp.description_raw = description;
        rfp.structured_data = {
          ...structured_data,
          metadata: existing_metadata,
        } as typeof rfp.structured_data;
        
        if (updateRfpDto.selected_vendors !== undefined) {
          if (!rfp.structured_data.metadata) {
            rfp.structured_data.metadata = {};
          }
          rfp.structured_data.metadata.selected_vendors = updateRfpDto.selected_vendors;
        }
      }
    }

    if (updateRfpDto.selected_vendors !== undefined && !updateRfpDto.description) {
      if (!rfp.structured_data) {
        rfp.structured_data = {
          budget: null,
          budget_currency: null,
          budget_per_unit: null,
          items: [],
          quantities: {},
          delivery_timeline: null,
          payment_terms: null,
          warranty: null,
          special_requests: null,
          category: null,
          metadata: {},
        };
      }
      if (!rfp.structured_data.metadata) {
        rfp.structured_data.metadata = {};
      }
      rfp.structured_data.metadata.selected_vendors = updateRfpDto.selected_vendors;
    }

    if (is_draft !== null) {
      rfp.is_draft = is_draft;
    }

    return this.rfpRepository.save(rfp);
  }

  async convertDraftToRfp(id: string, description?: string): Promise<Rfp> {
    const rfp = await this.rfpRepository.findOne({ where: { id, is_draft: true } });

    if (!rfp) {
      throw new NotFoundException(`Draft with ID ${id} not found`);
    }

    if (description) {
      const trimmed = description.trim();
      if (trimmed) {
        rfp.description_raw = trimmed;
        await this.rfpRepository.save(rfp);
      }
    }

    const structured_data = await this.aiService.generateStructuredRfp(rfp.description_raw);
    
    const is_valid = this.validateStructuredData(structured_data);
    
    if (!is_valid) {
      throw new BadRequestException(
        'The description provided is not detailed enough to create a valid RFP. Please provide more specific information including: items/products needed, quantities, budget, delivery timeline, payment terms, or warranty requirements.',
      );
    }
    
    rfp.structured_data = structured_data as typeof rfp.structured_data;
    rfp.is_draft = true;

    return this.rfpRepository.save(rfp);
  }

  async markDraftAsSent(id: string): Promise<void> {
    const rfp = await this.rfpRepository.findOne({ where: { id, is_draft: true } });
    if (rfp) {
      rfp.is_draft = false;
      await this.rfpRepository.save(rfp);
    }
  }

  async remove(id: string): Promise<void> {
    const rfp = await this.findOne(id);
    await this.rfpRepository.remove(rfp);
  }

  async regenerateStructuredData(id: string): Promise<Rfp['structured_data']> {
    const rfp = await this.findOne(id);
    const structured_data = await this.aiService.generateStructuredRfp(
      rfp.description_raw,
    );
    
    const is_valid = this.validateStructuredData(structured_data);
    
    if (!is_valid) {
      throw new BadRequestException(
        'The description provided is not detailed enough to create a valid RFP. Please provide more specific information including: items/products needed, quantities, budget, delivery timeline, payment terms, or warranty requirements.',
      );
    }
    
    rfp.structured_data = structured_data as typeof rfp.structured_data;
    await this.rfpRepository.save(rfp);
    return structured_data;
  }
}


