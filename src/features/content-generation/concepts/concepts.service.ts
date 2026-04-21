import {
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { BusinessException } from 'src/shared/exceptions/business.exception'
import { DBService } from 'src/core/database/database.service'
import { OpenaiService } from 'src/providers/ai/services/openai.service'
import { extractLoConceptsPrompt } from './prompts/extract-lo-concepts.prompt'
import { generateConceptDefinitionPrompt } from './prompts/generate-concept.prompt'
import { ExtractConceptsDto } from './dtos/req/extract-concepts.dto'
import { GenerateConceptDto } from './dtos/req/generate-concept.dto'
import { PageConceptsExtractedDto } from './dtos/res/generated-concept.dto'
import { GeneratedConceptDto } from './dtos/res/generated-concept.dto'
import { BlockType } from 'src/core/database/generated/enums'
import { parseJsonField } from 'src/providers/ai/helpers/utils'
import { validateAiResponse } from 'src/providers/ai/helpers/ai-response-validator'
import { pageConceptsExtractedSchema } from '../shared/schemas/ai-content.schema'

@Injectable()
export class ConceptsService {
  private readonly logger = new Logger(ConceptsService.name)

  constructor(
    private readonly dbService: DBService,
    private readonly openAiService: OpenaiService,
  ) {}

  async extractLoConcepts(
    data: ExtractConceptsDto,
  ): Promise<PageConceptsExtractedDto> {
    this.logger.log('Extrayendo conceptos del objeto de aprendizaje')
    const lo = await this.dbService.learningObject.findUnique({
      where: { id: data.learningObjectId },
      include: { blocks: true, module: { include: { aiConfiguration: true } } },
    })

    if (!lo) {
      throw new NotFoundException(
        `Objeto de aprendizaje con ID ${data.learningObjectId} no encontrado`,
      )
    }

    if (lo.blocks.length === 0) {
      throw new BusinessException(
        'El objeto de aprendizaje no tiene bloques',
        HttpStatus.BAD_REQUEST,
      )
    }

    const prompt = extractLoConceptsPrompt({
      blocks: lo.blocks
        .filter((b) => b.type === BlockType.TEXT)
        .map((b) => ({
          markdown: parseJsonField<{ markdown: string }>(b.content).markdown,
        })),
      config: {
        language: lo.module.aiConfiguration!.language,
      },
    })

    const aiResponse =
      await this.openAiService.getResponse<PageConceptsExtractedDto>(prompt)

    return validateAiResponse(
      aiResponse.content,
      pageConceptsExtractedSchema,
    ) as PageConceptsExtractedDto
  }

  async generateConcept(
    data: GenerateConceptDto,
  ): Promise<GeneratedConceptDto> {
    this.logger.log('Generando definición de concepto')

    const block = await this.dbService.block.findUnique({
      where: { id: data.blockId },
      include: { learningObject: true },
    })

    if (!block) {
      throw new NotFoundException(`Bloque con ID ${data.blockId} no encontrado`)
    }

    const prompt = generateConceptDefinitionPrompt({
      selectedText: data.selectedText,
      context: {
        surroundingText: parseJsonField<{ markdown: string }>(block.content)
          .markdown,
        pageTitle: block.learningObject.title,
      },
      config: {
        language: data.language ?? 'es',
        maxDefinitionLength: 120,
      },
    })

    const aiResponse =
      await this.openAiService.getResponse<PageConceptsExtractedDto>(prompt)

    const validated = validateAiResponse(
      aiResponse.content,
      pageConceptsExtractedSchema,
    )

    const terms = validated.terms
    if (!terms.length) {
      throw new BusinessException(
        'La IA no devolvió una definición válida para el término',
        HttpStatus.BAD_REQUEST,
      )
    }

    return terms[0]
  }
}
