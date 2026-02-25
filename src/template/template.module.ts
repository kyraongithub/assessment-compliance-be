import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { PDF_QUEUE } from '../queue/processors/pdf.processor';
import { TemplatesController } from './template.controller';
import { TemplatesService } from './template.service';

@Module({
  imports: [BullModule.registerQueue({ name: PDF_QUEUE })],
  controllers: [TemplatesController],
  providers: [TemplatesService],
})
export class TemplatesModule {}
