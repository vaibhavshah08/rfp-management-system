import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDraftDto {
  @ApiProperty({
    description: 'Natural language description of the RFP draft',
    example: 'I need 100 laptops with 16GB RAM, delivery within 30 days',
  })
  @IsString()
  @IsNotEmpty({ message: 'Description cannot be empty' })
  description: string;
}

