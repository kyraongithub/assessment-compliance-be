import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PdfProcessor, PDF_QUEUE } from './processors/pdf.processor';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
        },
        defaultJobOptions: {
          attempts: 3, // Retry failed jobs up to 3 times
          backoff: {
            type: 'exponential',
            delay: 5000, // 5s, 10s, 20s between retries
          },
          removeOnComplete: 50, // Keep last 50 completed jobs
          removeOnFail: 100, // Keep last 100 failed jobs
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: PDF_QUEUE,
    }),
  ],
  providers: [PdfProcessor],
  exports: [
    BullModule, // Export so TemplatesModule can inject the queue
  ],
})
export class QueueModule {}
