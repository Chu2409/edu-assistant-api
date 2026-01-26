import { Controller, Post, Body } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { ContentGenerationService } from './content-generation.service'
import { JwtAuth } from 'src/features/auth/decorators/jwt-auth.decorator'
import { Role } from 'src/core/database/generated/client'
import { ApiStandardResponse } from 'src/shared/decorators/api-standard-response.decorator'
import { GenerateContentDto } from './dtos/req/generate-content.dto'
import { GeneratePageContentDto } from './dtos/res/generate-page-content.dto'

@ApiTags('Content Generation')
@Controller('content')
@JwtAuth()
export class ContentGenerationController {
  constructor(
    private readonly contentGenerationService: ContentGenerationService,
  ) {}

  @Post('generate')
  @ApiOperation({
    summary: 'Generar contenido con IA',
    description:
      'Genera contenido educativo usando IA para un módulo. Solo disponible para profesores.',
  })
  @ApiStandardResponse(GeneratePageContentDto)
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({
    status: 403,
    description: 'Solo profesores pueden generar contenido',
  })
  @ApiResponse({
    status: 404,
    description: 'Módulo o configuración de IA no encontrada',
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @JwtAuth(Role.TEACHER)
  generateContent(@Body() dto: GenerateContentDto) {
    return this.contentGenerationService.generatePageContent({
      title: dto.title,
      audience: 'UNIVERSITY',
      contentLength: 'MEDIUM',
      language: 'en',
      learningObjectives: ['Entender los conceptos básicos de programación'],
      targetLevel: 'BASIC',
      tone: 'EDUCATIONAL',
    })
  }
}
