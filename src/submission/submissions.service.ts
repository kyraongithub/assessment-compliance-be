import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  ReviewSubmissionDto,
  UpsertSubmissionDto,
} from './dto/submissions.dto';

@Injectable()
export class SubmissionsService {
  constructor(private prisma: PrismaService) {}

  async upsert(userId: string, dto: UpsertSubmissionDto) {
    // Validate assessment belongs to this user
    const assessment = await this.prisma.assessment.findFirst({
      where: { id: dto.assessmentId, userId },
    });

    if (!assessment) {
      throw new NotFoundException(`Assessment ${dto.assessmentId} not found`);
    }

    if (assessment.status === 'REVIEWED') {
      throw new ForbiddenException('Cannot modify a reviewed assessment');
    }

    // Validate requirement exists
    const requirement = await this.prisma.requirement.findUnique({
      where: { id: dto.requirementId },
    });

    if (!requirement) {
      throw new NotFoundException(`Requirement ${dto.requirementId} not found`);
    }

    // Upsert — create if not exists, update if exists
    return this.prisma.submission.upsert({
      where: {
        assessmentId_requirementId: {
          assessmentId: dto.assessmentId,
          requirementId: dto.requirementId,
        },
      },
      create: {
        assessmentId: dto.assessmentId,
        requirementId: dto.requirementId,
        implementationDetail: dto.implementationDetail,
        evidenceLink: dto.evidenceLink,
        status: 'PENDING',
      },
      update: {
        implementationDetail: dto.implementationDetail,
        evidenceLink: dto.evidenceLink,
        status: 'PENDING', // Reset to PENDING when user edits
      },
      include: {
        requirement: {
          select: { id: true, title: true },
        },
      },
    });
  }

  async review(submissionId: string, dto: ReviewSubmissionDto) {
    const submission = await this.prisma.submission.findUnique({
      where: { id: submissionId },
    });

    if (!submission) {
      throw new NotFoundException(`Submission ${submissionId} not found`);
    }

    if (dto.status !== 'COMPLIANT' && dto.status !== 'REJECTED') {
      throw new BadRequestException('Status must be COMPLIANT or REJECTED');
    }

    return this.prisma.submission.update({
      where: { id: submissionId },
      data: {
        status: dto.status,
        reviewNote: dto.reviewNote,
      },
      include: {
        requirement: { select: { id: true, title: true } },
        assessment: { select: { id: true, userId: true } },
      },
    });
  }
}
