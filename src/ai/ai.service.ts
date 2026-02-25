import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { z } from 'zod';
import { zodResponseFormat } from 'openai/helpers/zod';

const RequirementSchema = z.object({
  title: z.string().describe('Short title of the compliance requirement'),
  description: z
    .string()
    .describe('Full description of what must be implemented to comply'),
});

const CategorySchema = z.object({
  name: z.string().describe('Category or section name from the document'),
  requirements: z
    .array(RequirementSchema)
    .describe('List of requirements within this category'),
});

export const ExtractedDocumentSchema = z.object({
  title: z.string().describe('Title of the compliance document'),
  categories: z
    .array(CategorySchema)
    .describe('All categories extracted from the document'),
});

export type ExtractedDocument = z.infer<typeof ExtractedDocumentSchema>;

@Injectable()
export class AiService {
  private readonly openai: OpenAI;
  private readonly logger = new Logger(AiService.name);

  // GPT-4o supports up to ~128k tokens — MAS TRM (56 pages) fits comfortably
  private readonly MODEL = 'gpt-4o-2024-08-06';

  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: configService.get<string>('OPENAI_API_KEY'),
    });
  }

  async extractRequirements(pdfText: string): Promise<ExtractedDocument> {
    this.logger.log('Sending document to OpenAI for extraction...');

    const completion = await this.openai.beta.chat.completions.parse({
      model: this.MODEL,
      messages: [
        {
          role: 'system',
          content: `You are a senior GRC (Governance, Risk, and Compliance) expert specializing in 
technology risk management for financial institutions.

Your task is to extract ALL compliance requirements from the provided regulatory document.

Guidelines:
- Identify every distinct compliance requirement, guideline, or control
- Group requirements under their parent category or section
- Write requirement titles as short, actionable phrases (e.g. "Multi-Factor Authentication for Privileged Access")
- Write descriptions as clear, complete explanations of what must be done to comply
- Do NOT skip any requirement — completeness is critical
- Preserve the document's original structure and hierarchy`,
        },
        {
          role: 'user',
          content: `Please extract all compliance requirements from this regulatory document:\n\n${pdfText}`,
        },
      ],
      response_format: zodResponseFormat(
        ExtractedDocumentSchema,
        'extracted_document',
      ),
      max_tokens: 16000,
    });

    const result = completion.choices[0].message.parsed;

    if (!result) {
      throw new Error('OpenAI returned empty structured output');
    }

    this.logger.log(
      `Extraction complete: ${result.categories.length} categories, ` +
        `${result.categories.reduce((sum, c) => sum + c.requirements.length, 0)} requirements`,
    );

    return result;
  }
}
