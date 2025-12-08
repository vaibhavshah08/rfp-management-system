import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vendor } from '../database/entities/vendor.entity';
import { Proposal } from '../database/entities/proposal.entity';
import { EmailRecord } from '../database/entities/email-record.entity';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';

@Injectable()
export class VendorService {
  constructor(
    @InjectRepository(Vendor)
    private vendorRepository: Repository<Vendor>,
    @InjectRepository(Proposal)
    private proposalRepository: Repository<Proposal>,
    @InjectRepository(EmailRecord)
    private emailRecordRepository: Repository<EmailRecord>,
  ) {}

  async create(createVendorDto: CreateVendorDto): Promise<Vendor> {
    const existing_vendor = await this.vendorRepository.findOne({
      where: { email: createVendorDto.email.toLowerCase().trim() },
    });

    if (existing_vendor) {
      throw new ConflictException('A vendor with this email already exists');
    }

    const vendor = this.vendorRepository.create({
      ...createVendorDto,
      email: createVendorDto.email.toLowerCase().trim(),
    });
    return this.vendorRepository.save(vendor);
  }

  async findAll(): Promise<Vendor[]> {
    return this.vendorRepository.find({
      relations: ['proposals'],
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Vendor> {
    const vendor = await this.vendorRepository.findOne({
      where: { id },
      relations: ['proposals'],
    });

    if (!vendor) {
      throw new NotFoundException(`Vendor with ID ${id} not found`);
    }

    return vendor;
  }

  async findByEmail(email: string): Promise<Vendor | null> {
    return this.vendorRepository.findOne({ where: { email } });
  }

  async update(id: string, updateVendorDto: UpdateVendorDto): Promise<Vendor> {
    const vendor = await this.findOne(id);

    if (updateVendorDto.email) {
      const normalized_email = updateVendorDto.email.toLowerCase().trim();
      const existing_vendor = await this.vendorRepository.findOne({
        where: { email: normalized_email },
      });

      if (existing_vendor && existing_vendor.id !== id) {
        throw new ConflictException('A vendor with this email already exists');
      }

      updateVendorDto.email = normalized_email;
    }

    Object.assign(vendor, updateVendorDto);
    return this.vendorRepository.save(vendor);
  }

  async remove(id: string): Promise<void> {
    const vendor = await this.findOne(id);
    
    // Check if vendor has associated proposals
    const proposals_count = await this.proposalRepository.count({
      where: { vendor_id: id },
    });

    // Check if vendor has associated email records (emails sent to them)
    const email_records_count = await this.emailRecordRepository.count({
      where: { vendor_id: id },
    });

    if (proposals_count > 0 || email_records_count > 0) {
      throw new BadRequestException(
        'Vendor cannot be deleted because it is associated with proposals or sent emails.',
      );
    }

    await this.vendorRepository.remove(vendor);
  }
}


