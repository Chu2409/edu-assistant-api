import { Controller, HttpStatus, Post, Body } from '@nestjs/common'
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger'
import { ContentGenerationService } from './content-generation.service'
import { JwtAuth } from 'src/features/auth/decorators/jwt-auth.decorator'
import { Role } from 'src/core/database/generated/client'
import { ApiStandardResponse } from 'src/shared/decorators/api-standard-response.decorator'
import { GenerateContentDto } from './dtos/req/generate-content.dto'
import { GeneratedPageContent } from './dtos/res/generated-page-content.dto'
import { GenerateImageDto } from './dtos/req/generate-image.dto'
import { GeneratedImageDto } from './dtos/res/generated-image.dto'
import { RegenerateContentDto } from './dtos/req/regenarte-content.dto'
import { RegenerateBlockDto } from './dtos/req/regenerate-block.dto'
import { ExpandContentDto } from './dtos/req/expand-content.dto'
import { ExtractConceptsDto } from './dtos/req/extract-concepts.dto'
import { PageConceptsExtractedDto } from './dtos/res/page-concepts-extracted.dto'
import { RegeneratedBlockDto } from './dtos/res/regenerated-block.dto'
import { ExpandedContentDto } from './dtos/res/expanded-content.dto'
import { GenerateActivityDto } from './dtos/req/generate-activity.dto'
import { GenerateRelationsDto } from './dtos/req/generate-relations.dto'
import {
  AiGeneratedFillBlankActivity,
  AiGeneratedMatchActivity,
  AiGeneratedMultipleChoiceActivity,
  AiGeneratedTrueFalseActivity,
} from './interfaces/ai-generated-activity.interface'
import { ApiRes } from 'src/shared/dtos/res/api-response.dto'
import { GeneratedRelationsDto } from './dtos/res/generated-relations.dto'

@ApiTags('Content Generation')
@Controller('content')
@JwtAuth()
export class ContentGenerationController {
  constructor(
    private readonly contentGenerationService: ContentGenerationService,
  ) {}

  @Post('generate-content')
  @ApiOperation({
    summary: 'Generar contenido con IA',
    description:
      'Genera contenido educativo usando IA para un módulo. Solo disponible para profesores.',
  })
  @ApiStandardResponse(GeneratedPageContent)
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
    return this.contentGenerationService.generatePageContent(dto)
  }

  @Post('regenerate-content')
  @ApiOperation({
    summary: 'Regenerar/refinar contenido con IA',
    description:
      'Refina el contenido actual de la página según una instrucción. Devuelve bloques sugeridos (no persiste). Solo disponible para profesores.',
  })
  @ApiStandardResponse(GeneratedPageContent, HttpStatus.CREATED)
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({
    status: 403,
    description: 'Solo profesores pueden regenerar contenido',
  })
  @JwtAuth(Role.TEACHER)
  regenerateContent(@Body() dto: RegenerateContentDto) {
    return this.contentGenerationService.regeneratePageContent(dto)
  }

  @Post('regenerate-block')
  @ApiOperation({
    summary: 'Regenerar bloque con IA',
    description:
      'Modifica un bloque específico de la página según las instrucciones del profesor. Devuelve el bloque sugerido (no persiste). Solo disponible para profesores.',
  })
  @ApiStandardResponse(RegeneratedBlockDto, HttpStatus.CREATED)
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({
    status: 403,
    description: 'Solo profesores pueden regenerar bloques',
  })
  @ApiResponse({ status: 404, description: 'Página no encontrada' })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o índice de bloque fuera de rango',
  })
  @JwtAuth(Role.TEACHER)
  regenerateBlock(@Body() dto: RegenerateBlockDto) {
    return this.contentGenerationService.regenerateBlock(dto)
  }

  @Post('expand-content')
  @ApiOperation({
    summary: 'Expandir contenido con IA',
    description:
      'Genera nuevos bloques de contenido para expandir la lección según instrucciones. Se especifica la posición (antes/después/reemplazar) respecto a un bloque. Devuelve los bloques sugeridos (no persiste). Solo disponible para profesores.',
  })
  @ApiStandardResponse(ExpandedContentDto, HttpStatus.CREATED)
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({
    status: 403,
    description: 'Solo profesores pueden expandir contenido',
  })
  @ApiResponse({ status: 404, description: 'Página no encontrada' })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o índice de bloque fuera de rango',
  })
  @JwtAuth(Role.TEACHER)
  expandContent(@Body() dto: ExpandContentDto) {
    return this.contentGenerationService.expandContent(dto)
  }

  @Post('extract-concepts')
  @ApiOperation({
    summary: 'Extraer conceptos de la página',
    description: 'Extrae conceptos de la página usando IA',
  })
  @ApiStandardResponse(PageConceptsExtractedDto, HttpStatus.CREATED)
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({
    status: 403,
    description: 'Solo profesores pueden extraer conceptos',
  })
  @JwtAuth(Role.TEACHER)
  extractConcepts(@Body() dto: ExtractConceptsDto) {
    return this.contentGenerationService.extractPageConcepts(dto)
  }

  @Post('generate-image')
  @ApiOperation({
    summary: 'Generar imagen con IA',
    description:
      'Genera una imagen a partir de un prompt (típicamente desde un IMAGE_SUGGESTION). Solo disponible para profesores.',
  })
  @ApiStandardResponse(GeneratedImageDto, HttpStatus.CREATED)
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({
    status: 403,
    description: 'Solo profesores pueden generar imágenes',
  })
  @JwtAuth(Role.TEACHER)
  async generateImage(@Body() dto: GenerateImageDto) {
    const base64 = await this.contentGenerationService.generateImage(dto.prompt)
    return { base64 }
  }

  @Post('generate-relations')
  @ApiOperation({
    summary: 'Generar relaciones entre páginas con IA',
    description:
      'Identifica frases en la página actual que enlazan naturalmente a otras páginas del módulo. Primero procesa el embedding de la página y busca similares por similitud semántica.',
  })
  @ApiStandardResponse(GeneratedRelationsDto, HttpStatus.CREATED)
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({
    status: 403,
    description: 'Solo profesores pueden generar relaciones',
  })
  @ApiResponse({ status: 404, description: 'Página no encontrada' })
  @ApiResponse({ status: 400, description: 'Datos inválidos o sin bloques' })
  @JwtAuth(Role.TEACHER)
  generateRelations(@Body() dto: GenerateRelationsDto) {
    return this.contentGenerationService.generatePageRelations(dto)
  }

  @Post('generate-activity')
  @ApiOperation({
    summary: 'Generar actividad con IA',
    description:
      'Genera una actividad (reactivo) a partir de los bloques de una página. Solo disponible para profesores.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Resource created successfully',
    schema: {
      allOf: [
        { $ref: getSchemaPath(ApiRes) },
        {
          properties: {
            data: {
              oneOf: [
                { $ref: getSchemaPath(AiGeneratedMultipleChoiceActivity) },
                { $ref: getSchemaPath(AiGeneratedTrueFalseActivity) },
                { $ref: getSchemaPath(AiGeneratedFillBlankActivity) },
                { $ref: getSchemaPath(AiGeneratedMatchActivity) },
              ],
            },
          },
        },
      ],
    },
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({
    status: 403,
    description: 'Solo profesores pueden generar actividades',
  })
  @ApiResponse({ status: 404, description: 'Página no encontrada' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @JwtAuth(Role.TEACHER)
  generateActivity(@Body() dto: GenerateActivityDto) {
    return this.contentGenerationService.generateActivity(dto)
  }
}
