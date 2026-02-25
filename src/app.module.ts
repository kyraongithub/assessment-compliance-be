import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AiModule } from './ai/ai.module';
import { PusherModule } from './pusher/pusher.module';
import { QueueModule } from './queue/queue.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/user.module';
import { TemplatesModule } from './template/template.module';
import { AssessmentsModule } from './assessment/assessment.module';
import { SubmissionsModule } from './submission/submissions.module';

@Module({
  imports: [
    // Load .env globally
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Core infrastructure
    PrismaModule,
    PusherModule,
    AiModule,
    QueueModule,

    // Auth
    AuthModule,
    UsersModule,

    // Features
    TemplatesModule,
    AssessmentsModule,
    SubmissionsModule,
  ],
})
export class AppModule {}
