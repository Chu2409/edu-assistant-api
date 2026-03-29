import { Controller, HttpStatus, Post, Body } from '@nestjs/common'
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger'
import { JwtAuth } from 'src/features/auth/decorators/jwt-auth.decorator'
import { Role } from 'src/core/database/generated/client'
import { ApiStandardResponse } from 'src/shared/decorators/api-standard-response.decorator'
import { ApiRes } from 'src/shared/dtos/res/api-response.dto'

// Page Content
import { PageContentService } from './page-content/page-content.service'
import { GenerateContentDto } from './page-content/dtos/req/generate-content.dto'
import { RegenerateContentDto } from './page-content/dtos/req/regenerate-content.dto'
import { RegenerateBlockDto } from './page-content/dtos/req/regenerate-block.dto'
import { ExpandContentDto } from './page-content/dtos/req/expand-content.dto'
import { GenerateImageDto } from './page-content/dtos/req/generate-image.dto'
import { GeneratedPageContent } from './page-content/dtos/res/generated-page-content.dto'
import { RegeneratedBlockDto } from './page-content/dtos/res/regenerated-block.dto'
import { ExpandedContentDto } from './page-content/dtos/res/expanded-content.dto'
import { GeneratedImageDto } from './page-content/dtos/res/generated-image.dto'

// Concepts
import { ConceptsService } from './concepts/concepts.service'
import { ExtractConceptsDto } from './concepts/dtos/req/extract-concepts.dto'
import { GenerateConceptDto } from './concepts/dtos/req/generate-concept.dto'
import { PageConceptsExtractedDto } from './concepts/dtos/res/generated-concept.dto'
import { GeneratedConceptDto } from './concepts/dtos/res/generated-concept.dto'

// Relations
import { RelationsService } from './relations/relations.service'
import { GenerateRelationsDto } from './relations/dtos/req/generate-relations.dto'
import { GeneratedRelationsDto } from './relations/dtos/res/generated-relations.dto'

// Activities
import { ActivitiesService } from './activities/activities.service'
import { GenerateActivityDto } from './activities/dtos/req/generate-activity.dto'
import {
  AiFillBlankActivity,
  AiGeneratedMatchActivity,
  AiMultipleChoiceActivity,
  AiTrueFalseActivity,
} from './activities/interfaces/ai-generated-activity.interface'

@ApiTags('Content Generation')
@Controller('content')
@JwtAuth(Role.TEACHER)
export class ContentGenerationController {
  constructor(
    private readonly pageContentService: PageContentService,
    private readonly conceptsService: ConceptsService,
    private readonly relationsService: RelationsService,
    private readonly activitiesService: ActivitiesService,
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
  generateContent(@Body() dto: GenerateContentDto) {
    return this.pageContentService.generatePageContent(dto)
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
  regenerateContent(@Body() dto: RegenerateContentDto) {
    return this.pageContentService.regeneratePageContent(dto)
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
    description: 'Datos inválidos o bloque no encontrado por su orden',
  })
  regenerateBlock(@Body() dto: RegenerateBlockDto) {
    return this.pageContentService.regenerateBlock(dto)
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
    description: 'Datos inválidos o bloque no encontrado por su orden',
  })
  expandContent(@Body() dto: ExpandContentDto) {
    return this.pageContentService.expandContent(dto)
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
  extractConcepts(@Body() dto: ExtractConceptsDto) {
    return this.conceptsService.extractPageConcepts(dto)
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
  async generateImage(@Body() dto: GenerateImageDto) {
    const base64 = await this.pageContentService.generateImage(dto.prompt)
    return { base64 }
  }

  @Post('generate-concept')
  @ApiOperation({
    summary: 'Generar definición de concepto con IA',
    description:
      'Genera una definición educativa para un término seleccionado, usando el contexto de la página donde aparece.',
  })
  @ApiStandardResponse(GeneratedConceptDto, HttpStatus.CREATED)
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({
    status: 403,
    description: 'Solo profesores pueden generar definiciones de conceptos',
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  generateConcept(@Body() dto: GenerateConceptDto) {
    return this.conceptsService.generateConcept(dto)
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
  generateRelations(@Body() dto: GenerateRelationsDto) {
    return this.relationsService.generatePageRelations(dto)
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
                { $ref: getSchemaPath(AiMultipleChoiceActivity) },
                { $ref: getSchemaPath(AiTrueFalseActivity) },
                { $ref: getSchemaPath(AiFillBlankActivity) },
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
  generateActivity(@Body() dto: GenerateActivityDto) {
    return this.activitiesService.generateActivity(dto)
  }
}
