import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsUrl } from 'class-validator';
import { ReviewStatus } from '@prisma/client';

export class UpsertSubmissionDto {
  @ApiProperty({ example: 'clx1234assessment' })
  @IsString()
  assessmentId: string;

  @ApiProperty({ example: 'clx1234requirement' })
  @IsString()
  requirementId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  implementationDetail?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  evidenceLink?: string;
}

export class ReviewSubmissionDto {
  @ApiProperty({ enum: ['COMPLIANT', 'REJECTED'] })
  @IsString()
  status: ReviewStatus;

  @ApiProperty({
    required: false,
    description: 'Optional review note from admin',
  })
  @IsOptional()
  @IsString()
  reviewNote?: string;
}
