import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UploadTemplateDto } from './dto/upload-template.dto';
import { TemplatesService } from './template.service';

@ApiTags('Templates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('templates')
export class TemplatesController {
  constructor(private templatesService: TemplatesService) {}

  /**
   * POST /templates/upload
   * Admin uploads a regulatory PDF — triggers async AI processing
   */
  @Post('upload')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.ACCEPTED) // 202 — processing is async
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(), // Keep file in memory, not disk
      limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
      fileFilter: (req, file, cb) => {
        if (file.mimetype !== 'application/pdf') {
          cb(new BadRequestException('Only PDF files are accepted'), false);
        } else {
          cb(null, true);
        }
      },
    }),
  )
  @ApiOperation({ summary: 'Upload regulatory PDF for AI processing (Admin)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        title: { type: 'string' },
        description: { type: 'string' },
      },
    },
  })
  async uploadTemplate(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadTemplateDto,
  ) {
    if (!file) {
      throw new BadRequestException('PDF file is required');
    }

    return this.templatesService.uploadTemplate(dto, file.buffer);
  }

  /**
   * GET /templates
   * List all templates (any authenticated user)
   */
  @Get()
  @ApiOperation({ summary: 'List all assessment templates' })
  findAll() {
    return this.templatesService.findAll();
  }

  /**
   * GET /templates/:id
   * Get template with all categories and requirements
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get template details with categories & requirements',
  })
  findOne(@Param('id') id: string) {
    return this.templatesService.findOne(id);
  }
}
