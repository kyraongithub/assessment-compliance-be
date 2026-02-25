import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { z } from 'zod';
import { zodResponseFormat } from 'openai/helpers/zod';

const RequirementSchema = z.object({
  title: z.string(),
  description: z.string(),
});

const CategorySchema = z.object({
  name: z.string(),
  requirements: z.array(RequirementSchema),
});

export const ExtractedDocumentSchema = z.object({
  title: z.string(),
  categories: z.array(CategorySchema),
});

export type ExtractedDocument = z.infer<typeof ExtractedDocumentSchema>;

@Injectable()
export class AiService {
  private readonly openai: OpenAI;
  private readonly logger = new Logger(AiService.name);
  private readonly MODEL = 'gpt-4o';

  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: configService.get<string>('OPENAI_API_KEY'),
    });
  }

  async extractRequirements(textChunk: string): Promise<ExtractedDocument> {
    this.logger.log(`Sending chunk to OpenAI (${textChunk.length} chars)`);

    const completion = await this.openai.beta.chat.completions.parse({
      model: this.MODEL,
      messages: [
        {
          role: 'system',
          content: `
You are a senior GRC expert.

Extract ALL compliance requirements from the document.
Group by section.
Use short actionable titles.
Do not skip any requirement.
Return structured JSON only.
`,
        },
        {
          role: 'user',
          content: textChunk,
        },
      ],
      response_format: zodResponseFormat(
        ExtractedDocumentSchema,
        'extracted_document',
      ),
      max_tokens: 3000,
    });

    const result = completion.choices[0].message.parsed;

    if (!result) {
      throw new Error('OpenAI returned empty structured output');
    }

    this.logger.log(`Chunk extracted: ${result.categories.length} categories`);

    return result;
  }
}
