import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRfpDto {
  @ApiProperty({
    description: 'Natural language description of the RFP',
    example: 'I need 100 laptops with 16GB RAM, delivery within 30 days, budget $50,000',
  })
  @IsString()
  @IsNotEmpty({ message: 'Description cannot be empty' })
  description: string;
}


