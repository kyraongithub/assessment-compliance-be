import { Module } from '@nestjs/common';
import { AssessmentsController } from './assessment.controller';
import { AssessmentsService } from './assessment.service';

@Module({
  controllers: [AssessmentsController],
  providers: [AssessmentsService],
})
export class AssessmentsModule {}
