import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateAssessmentDto } from './dto/create-assessment.dto';
import { AssessmentsService } from './assessment.service';

@ApiTags('Assessments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('assessments')
export class AssessmentsController {
  constructor(private assessmentsService: AssessmentsService) {}

  /**
   * POST /assessments
   * User starts a new assessment from a template
   */
  @Post()
  @ApiOperation({ summary: 'Start a new assessment from a template' })
  create(@CurrentUser() user: User, @Body() dto: CreateAssessmentDto) {
    return this.assessmentsService.create(user.id, dto);
  }

  /**
   * GET /assessments
   * List all assessments for the current user
   */
  @Get()
  @ApiOperation({ summary: 'List my assessments' })
  findAll(@CurrentUser() user: User) {
    return this.assessmentsService.findAllByUser(user.id);
  }

  /**
   * GET /assessments/:id
   * Get full assessment with template, requirements, and submissions
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get assessment details' })
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.assessmentsService.findOne(id, user.id);
  }
}
