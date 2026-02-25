import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAssessmentDto } from './dto/create-assessment.dto';

@Injectable()
export class AssessmentsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateAssessmentDto) {
    // Validate template exists and is AVAILABLE
    const template = await this.prisma.assessmentTemplate.findUnique({
      where: { id: dto.templateId },
    });

    if (!template) {
      throw new NotFoundException(`Template ${dto.templateId} not found`);
    }

    if (template.status !== 'AVAILABLE') {
      throw new BadRequestException(
        `Template is not available yet (status: ${template.status})`,
      );
    }

    const assessment = await this.prisma.assessment.create({
      data: {
        userId,
        templateId: dto.templateId,
        status: 'IN_PROGRESS',
      },
      include: {
        template: {
          select: { id: true, title: true },
        },
      },
    });

    return assessment;
  }

  async findAllByUser(userId: string) {
    return this.prisma.assessment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        template: {
          select: { id: true, title: true, status: true },
        },
        _count: {
          select: { submissions: true },
        },
      },
    });
  }

  async findOne(id: string, userId: string) {
    const assessment = await this.prisma.assessment.findFirst({
      where: { id, userId },
      include: {
        template: {
          include: {
            categories: {
              include: {
                requirements: true,
              },
            },
          },
        },
        submissions: {
          include: {
            requirement: {
              select: { id: true, title: true },
            },
          },
        },
      },
    });

    if (!assessment) {
      throw new NotFoundException(`Assessment ${id} not found`);
    }

    return assessment;
  }
}
