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

  private splitIntoChunks(text: string, maxChars = 12000): string[] {
    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      chunks.push(text.slice(start, start + maxChars));
      start += maxChars;
    }

    return chunks;
  }

  async uploadTemplate(dto: UploadTemplateDto, fileBuffer: Buffer) {
    const pdfData = await pdfParse(fileBuffer);
    const pdfText = pdfData.text;

    if (!pdfText || pdfText.trim().length < 100) {
      throw new Error('PDF appears to be empty or unreadable');
    }

    const template = await this.prisma.assessmentTemplate.create({
      data: {
        title: dto.title,
        description: dto.description,
        status: 'PROCESSING',
      },
    });

    const chunks = this.splitIntoChunks(pdfText);

    const payload: PdfJobPayload = {
      templateId: template.id,
      chunks,
    };

    await this.pdfQueue.add(PDF_JOB, payload, {
      jobId: `template-${template.id}`,
    });

    return {
      templateId: template.id,
      title: template.title,
      status: template.status,
      chunks: chunks.length,
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
            requirements: true,
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
