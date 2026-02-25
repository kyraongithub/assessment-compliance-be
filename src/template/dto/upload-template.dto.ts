import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength } from 'class-validator';

export class UploadTemplateDto {
  @ApiProperty({ example: 'MAS Technology Risk Management Guidelines 2021' })
  @IsString()
  @MinLength(3)
  title: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;
}
