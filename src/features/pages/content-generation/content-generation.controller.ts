import { Controller, Post, Body } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { ContentGenerationService } from './content-generation.service'
import { JwtAuth } from 'src/features/auth/decorators/jwt-auth.decorator'
import { Role } from 'src/core/database/generated/client'
import { ApiStandardResponse } from 'src/shared/decorators/api-standard-response.decorator'
import { GenerateContentDto } from './dtos/req/generate-content.dto'
import { PageContentGeneratedDto } from './dtos/res/page-content-generated.dto'
import { DBService } from 'src/core/database/database.service'
import { ExtractConceptsDto } from './dtos/req/extract-concepts.dto'
import { TextBlock } from './interfaces/content-block.interface'
import { BlocksMapper } from '../blocks/mappers/blocks.mapper'
import { PageConceptsExtractedDto } from './dtos/res/page-concepts-extracted.dto'
import { RegenerateContentDto } from './dtos/req/regenarte-content.dto'

@ApiTags('Content Generation')
@Controller('content')
@JwtAuth()
export class ContentGenerationController {
  constructor(
    private readonly contentGenerationService: ContentGenerationService,
    private readonly dbService: DBService,
  ) {}

  @Post('generate')
  @ApiOperation({
    summary: 'Generar contenido con IA',
    description:
      'Genera contenido educativo usando IA para un módulo. Solo disponible para profesores.',
  })
  @ApiStandardResponse(PageContentGeneratedDto)
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

  @Post('extract-concepts')
  @ApiOperation({
    summary: 'Extraer conceptos con IA',
    description:
      'Extrae conceptos clave de una página usando IA. Solo disponible para profesores.',
  })
  @ApiStandardResponse(PageConceptsExtractedDto)
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
  async extractConcepts(@Body() dto: ExtractConceptsDto) {
    const page = await this.dbService.page.findUnique({
      where: { id: dto.pageId },
      include: { module: true, blocks: true },
    })

    const blocks = page?.blocks.map((b) => BlocksMapper.mapToDto(b))

    return this.contentGenerationService.extractPageConcepts({
      audience: 'UNIVERSITY',
      language: 'en',
      targetLevel: 'INTERMEDIATE',
      maxTerms: 6,
      textBlocks:
        blocks
          ?.filter((b) => b.type === 'TEXT')
          .map((b) => b.content as TextBlock) || [],
    })
  }

  @Post('regenerate')
  @ApiOperation({
    summary: 'Regenerar contenido de página con IA',
    description:
      'Regenera el contenido de una página existente usando IA según las instrucciones proporcionadas. Si la página tiene ediciones manuales, se regenera sin contexto. Si no tiene ediciones manuales, se usa el contexto de la conversación anterior. Solo disponible para profesores.',
  })
  @ApiStandardResponse(PageContentGeneratedDto)
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({
    status: 403,
    description: 'Solo profesores pueden regenerar contenido',
  })
  @ApiResponse({
    status: 404,
    description: 'Página o configuración de IA no encontrada',
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @JwtAuth(Role.TEACHER)
  async regenerateContent(@Body() dto: RegenerateContentDto) {
    return this.contentGenerationService.regeneratePageContent(
      dto.pageId,
      dto.instruction,
    )
  }
}
