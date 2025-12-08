import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RfpService } from './rfp.service';
import { CreateRfpDto } from './dto/create-rfp.dto';
import { CreateDraftDto } from './dto/create-draft.dto';
import { UpdateRfpDto } from './dto/update-rfp.dto';
import { SendRfpDto } from './dto/send-rfp.dto';
import { EmailService } from '../email/email.service';

@ApiTags('RFPs')
@Controller('rfps')
export class RfpController {
  constructor(
    private readonly rfpService: RfpService,
    private readonly emailService: EmailService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new RFP using AI' })
  @ApiResponse({ status: 201, description: 'RFP created successfully' })
  create(@Body() createRfpDto: CreateRfpDto) {
    return this.rfpService.create(createRfpDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all RFPs' })
  findAll() {
    return this.rfpService.findAll();
  }

  @Get('drafts')
  @ApiOperation({ summary: 'Get all draft RFPs' })
  findAllDrafts() {
    return this.rfpService.findAllDrafts();
  }

  @Post('drafts')
  @ApiOperation({ summary: 'Create a new RFP draft' })
  @ApiResponse({ status: 201, description: 'Draft created successfully' })
  createDraft(@Body() createDraftDto: CreateDraftDto) {
    return this.rfpService.create(createDraftDto, true);
  }

  @Post(':id/convert-to-rfp')
  @ApiOperation({
    summary: 'Convert draft to RFP by generating structured data',
  })
  @ApiResponse({
    status: 200,
    description: 'Draft converted to RFP successfully',
  })
  convertDraftToRfp(
    @Param('id') id: string,
    @Body() body?: { description?: string },
  ) {
    return this.rfpService.convertDraftToRfp(id, body?.description);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get RFP by ID' })
  findOne(@Param('id') id: string) {
    return this.rfpService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update RFP' })
  update(@Param('id') id: string, @Body() updateRfpDto: UpdateRfpDto) {
    return this.rfpService.update(id, updateRfpDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete RFP' })
  remove(@Param('id') id: string) {
    return this.rfpService.remove(id);
  }

  @Post(':id/send')
  @ApiOperation({ summary: 'Send RFP to vendors via email' })
  async sendRfp(@Param('id') id: string, @Body() sendRfpDto: SendRfpDto) {
    const rfp = await this.rfpService.findOne(id);
    return this.emailService.sendRfpToVendors(rfp, sendRfpDto.vendor_ids);
  }

  @Post(':id/regenerate')
  @ApiOperation({ summary: 'Regenerate RFP structured data using AI' })
  @ApiResponse({ status: 200, description: 'RFP regenerated successfully' })
  async regenerate(@Param('id') id: string) {
    const rfp = await this.rfpService.findOne(id);
    const structured_data = await this.rfpService.regenerateStructuredData(
      rfp.id,
    );
    return { ...rfp, structured_data: structured_data };
  }

  @Get(':id/email-preview')
  @ApiOperation({ summary: 'Get email preview for RFP' })
  @ApiResponse({ status: 200, description: 'Email preview generated' })
  async getEmailPreview(@Param('id') id: string) {
    const rfp = await this.rfpService.findOne(id);
    return await this.emailService.generateEmailPreview(rfp);
  }
}
