import { Controller, Get, Param, Patch, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ProposalService } from './proposal.service';

@ApiTags('Proposals')
@Controller('proposals')
export class ProposalController {
  constructor(private readonly proposalService: ProposalService) {}

  @Get()
  @ApiOperation({ summary: 'Get all proposals' })
  findAll() {
    return this.proposalService.findAll();
  }

  @Get('rfp/:rfpId')
  @ApiOperation({ summary: 'Get all proposals for an RFP' })
  findByRfp(@Param('rfpId') rfpId: string) {
    return this.proposalService.findByRfpId(rfpId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get proposal by ID' })
  findOne(@Param('id') id: string) {
    return this.proposalService.findOne(id);
  }

  @Get('rfp/:rfpId/compare')
  @ApiOperation({ summary: 'Compare proposals for an RFP using AI' })
  compare(@Param('rfpId') rfpId: string) {
    return this.proposalService.compareProposals(rfpId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update proposal structured data' })
  update(@Param('id') id: string, @Body() update_data: any) {
    return this.proposalService.update(id, update_data);
  }
}


