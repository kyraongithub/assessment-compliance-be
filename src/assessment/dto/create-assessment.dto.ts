import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAssessmentDto {
  @ApiProperty({ example: 'clx1234abcd' })
  @IsString()
  templateId: string;
}
