import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { AiService, ExtractedDocument } from '../../ai/ai.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PusherService } from '../../pusher/pusher.service';

export const PDF_QUEUE = 'pdf-processing-queue';
export const PDF_JOB = 'process-pdf';

export interface PdfJobPayload {
  templateId: string;
  chunks: string[];
}

@Processor(PDF_QUEUE)
export class PdfProcessor {
  private readonly logger = new Logger(PdfProcessor.name);

  constructor(
    private aiService: AiService,
    private prisma: PrismaService,
    private pusherService: PusherService,
  ) {}

  private mergeResults(results: ExtractedDocument[]): ExtractedDocument {
    return {
      title: results[0]?.title || 'Extracted Document',
      categories: results.flatMap((r) => r.categories),
    };
  }

  @Process(PDF_JOB)
  async handlePdfProcessing(job: Job<PdfJobPayload>) {
    const { templateId, chunks } = job.data;

    this.logger.log(
      `Processing template ${templateId} with ${chunks.length} chunks`,
    );

    try {
      const allResults: ExtractedDocument[] = [];

      let progress = 10;

      for (let i = 0; i < chunks.length; i++) {
        this.logger.log(`Processing chunk ${i + 1}/${chunks.length}`);

        const result = await this.aiService.extractRequirements(chunks[i]);
        allResults.push(result);

        progress = 10 + Math.floor((i / chunks.length) * 60);
        await job.progress(progress);

        // Anti-TPM burst protection
        await new Promise((res) => setTimeout(res, 1200));
      }

      const extracted = this.mergeResults(allResults);

      await job.progress(75);

      // Save incrementally
      for (const categoryData of extracted.categories) {
        const category = await this.prisma.category.create({
          data: {
            name: categoryData.name,
            templateId,
          },
        });

        await this.prisma.requirement.createMany({
          data: categoryData.requirements.map((req) => ({
            title: req.title,
            description: req.description,
            categoryId: category.id,
          })),
        });
      }

      await job.progress(90);

      await this.prisma.assessmentTemplate.update({
        where: { id: templateId },
        data: { status: 'AVAILABLE' },
      });

      await this.pusherService.trigger('admin-channel', 'TEMPLATE_READY', {
        templateId,
        status: 'AVAILABLE',
        categoriesCount: extracted.categories.length,
        requirementsCount: extracted.categories.reduce(
          (sum, c) => sum + c.requirements.length,
          0,
        ),
      });

      await job.progress(100);
      this.logger.log(`✅ Template ${templateId} completed`);
    } catch (error) {
      this.logger.error(`❌ Failed template ${templateId}: ${error.message}`);

      await this.prisma.assessmentTemplate.update({
        where: { id: templateId },
        data: { status: 'FAILED' },
      });

      await this.pusherService.trigger('admin-channel', 'TEMPLATE_FAILED', {
        templateId,
        error: error.message,
      });

      throw error;
    }
  }
}
