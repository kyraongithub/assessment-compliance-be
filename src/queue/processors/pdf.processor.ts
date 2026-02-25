import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { AiService } from '../../ai/ai.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PusherService } from '../../pusher/pusher.service';

export const PDF_QUEUE = 'pdf-processing-queue';
export const PDF_JOB = 'process-pdf';

export interface PdfJobPayload {
  templateId: string;
  pdfText: string;
}

@Processor(PDF_QUEUE)
export class PdfProcessor {
  private readonly logger = new Logger(PdfProcessor.name);

  constructor(
    private aiService: AiService,
    private prisma: PrismaService,
    private pusherService: PusherService,
  ) {}

  @Process(PDF_JOB)
  async handlePdfProcessing(job: Job<PdfJobPayload>) {
    const { templateId, pdfText } = job.data;
    this.logger.log(`Processing PDF job for template: ${templateId}`);

    try {
      // ── Step 1: Extract requirements via OpenAI ──────────────────────────
      await job.progress(10);
      const extracted = await this.aiService.extractRequirements(pdfText);
      this.logger.log(`AI extraction done for template: ${templateId}`);

      // ── Step 2: Persist categories and requirements to DB ────────────────
      await job.progress(50);

      for (const categoryData of extracted.categories) {
        const category = await this.prisma.category.create({
          data: {
            name: categoryData.name,
            templateId,
          },
        });

        // Bulk create requirements for this category
        await this.prisma.requirement.createMany({
          data: categoryData.requirements.map((req) => ({
            title: req.title,
            description: req.description,
            categoryId: category.id,
          })),
        });
      }

      this.logger.log(`DB insert complete for template: ${templateId}`);

      // ── Step 3: Update template status to AVAILABLE ──────────────────────
      await job.progress(90);

      await this.prisma.assessmentTemplate.update({
        where: { id: templateId },
        data: { status: 'AVAILABLE' },
      });

      // ── Step 4: Notify admin via Pusher ──────────────────────────────────
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
      this.logger.log(`✅ Template ${templateId} processing complete`);
    } catch (error) {
      this.logger.error(
        `❌ Failed to process template ${templateId}: ${error.message}`,
      );

      // Mark template as FAILED so admin knows something went wrong
      await this.prisma.assessmentTemplate
        .update({
          where: { id: templateId },
          data: { status: 'FAILED' },
        })
        .catch(() => {}); // Swallow error if template already deleted

      // Notify admin of failure via Pusher
      await this.pusherService.trigger('admin-channel', 'TEMPLATE_FAILED', {
        templateId,
        error: error.message,
      });

      throw error; // Re-throw so Bull marks job as failed
    }
  }
}
