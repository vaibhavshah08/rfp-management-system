import { IsArray, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendRfpDto {
  @ApiProperty({
    description: 'Array of vendor IDs to send the RFP to',
    example: ['uuid1', 'uuid2'],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  vendor_ids: string[];
}


