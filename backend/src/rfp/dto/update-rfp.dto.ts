import { PartialType } from '@nestjs/swagger';
import { IsOptional, IsArray, IsString } from 'class-validator';
import { CreateRfpDto } from './create-rfp.dto';

export class UpdateRfpDto extends PartialType(CreateRfpDto) {
  @IsOptional()
  @IsArray()
  selected_vendors?: string[];
}


