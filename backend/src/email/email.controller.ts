import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { EmailService } from './email.service';

@ApiTags('Email')
@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post('check-replies')
  @ApiOperation({ summary: 'Manually check for new email replies' })
  @ApiResponse({
    status: 200,
    description: 'Email check completed',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        processed: { type: 'number' },
      },
    },
  })
  async checkReplies() {
    return this.emailService.checkForNewEmailsManually();
  }

  @Get('sent')
  @ApiOperation({ summary: 'Get all sent email records' })
  async getSentEmails() {
    return this.emailService.getSentEmails();
  }

  @Get('sent/rfp/:rfpId')
  @ApiOperation({ summary: 'Get sent emails for a specific RFP' })
  async getSentEmailsForRfp(@Param('rfpId') rfpId: string) {
    return this.emailService.getSentEmailsForRfp(rfpId);
  }
}
