import { Controller, Put, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Role, User } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SubmissionsService } from './submissions.service';
import {
  UpsertSubmissionDto,
  ReviewSubmissionDto,
} from './dto/submissions.dto';

@ApiTags('Submissions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('submissions')
export class SubmissionsController {
  constructor(private submissionsService: SubmissionsService) {}

  /**
   * PUT /submissions
   * User upserts their answer for a specific requirement
   */
  @Put()
  @Roles(Role.USER)
  @ApiOperation({ summary: 'Save/update submission for a requirement' })
  upsert(@CurrentUser() user: User, @Body() dto: UpsertSubmissionDto) {
    return this.submissionsService.upsert(user.id, dto);
  }

  /**
   * PUT /submissions/:id/review
   * Admin reviews a submission (COMPLIANT or REJECTED)
   */
  @Put(':id/review')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Admin review a submission' })
  review(@Param('id') id: string, @Body() dto: ReviewSubmissionDto) {
    return this.submissionsService.review(id, dto);
  }
}
