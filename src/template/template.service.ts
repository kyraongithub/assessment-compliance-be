import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../prisma/prisma.service';
import {
  PDF_QUEUE,
  PDF_JOB,
  PdfJobPayload,
} from '../queue/processors/pdf.processor';
import * as pdfParse from 'pdf-parse';
import { UploadTemplateDto } from './dto/upload-template.dto';

@Injectable()
export class TemplatesService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue(PDF_QUEUE) private pdfQueue: Queue,
  ) {}

  async uploadTemplate(dto: UploadTemplateDto, fileBuffer: Buffer) {
    // ── Step 1: Parse PDF to text ────────────────────────────────────────────
    const pdfData = await pdfParse(fileBuffer);
    const pdfText = pdfData.text;

    if (!pdfText || pdfText.trim().length < 100) {
      throw new Error('PDF appears to be empty or unreadable');
    }

    // ── Step 2: Create template record with PROCESSING status ────────────────
    const template = await this.prisma.assessmentTemplate.create({
      data: {
        title: dto.title,
        description: dto.description,
        status: 'PROCESSING',
      },
    });

    // ── Step 3: Enqueue PDF processing job ───────────────────────────────────
    const payload: PdfJobPayload = {
      templateId: template.id,
      pdfText,
    };

    await this.pdfQueue.add(PDF_JOB, payload, {
      jobId: `template-${template.id}`, // Prevent duplicate jobs
    });

    return {
      templateId: template.id,
      title: template.title,
      status: template.status,
    };
  }

  async findAll() {
    return this.prisma.assessmentTemplate.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        createdAt: true,
        _count: {
          select: { categories: true, assessments: true },
        },
      },
    });
  }

  async findOne(id: string) {
    const template = await this.prisma.assessmentTemplate.findUnique({
      where: { id },
      include: {
        categories: {
          include: {
            requirements: {
              select: {
                id: true,
                title: true,
                description: true,
              },
            },
          },
        },
        _count: {
          select: { assessments: true },
        },
      },
    });

    if (!template) {
      throw new NotFoundException(`Template ${id} not found`);
    }

    return template;
  }
}
