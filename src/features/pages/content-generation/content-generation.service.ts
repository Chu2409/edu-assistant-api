import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { DBService } from 'src/core/database/database.service'
import { OpenaiService } from 'src/providers/ai/openai.service'
import {
  generatePageContentPrompt,
  GeneratePageContentPrompt,
} from './prompts/generate-page-content.prompt'
import { PageContentGeneratedDto } from './dtos/res/page-content-generated.dto'
import {
  extractPageConceptsPrompt,
  ExtractPageConceptsPrompt,
} from './prompts/extract-page-concepts.prompt'
import { PageConceptsExtractedDto } from './dtos/res/page-concepts-extracted.dto'
import {
  regeneratePageContentWithContextPrompt,
  regenerateWithoutContextPrompt,
} from './prompts/regenerate-page-content.prompt'

@Injectable()
export class ContentGenerationService {
  private readonly logger = new Logger(ContentGenerationService.name)
  constructor(
    private readonly dbService: DBService,
    private readonly openAiService: OpenaiService,
  ) {}

  async generatePageContent(
    data: GeneratePageContentPrompt,
  ): Promise<PageContentGeneratedDto> {
    this.logger.log('Generating page content')
    const prompt = generatePageContentPrompt(data)
    const content = await this.openAiService.getResponse(prompt)

    return content
  }

  async extractPageConcepts(
    data: ExtractPageConceptsPrompt,
  ): Promise<PageConceptsExtractedDto> {
    this.logger.log('Extracting page concepts')
    const prompt = extractPageConceptsPrompt(data)

    const content = await this.openAiService.getResponse(prompt)

    return content.content
  }

  async regeneratePageContent(
    pageId: number,
    instruction: string,
  ): Promise<PageContentGeneratedDto> {
    this.logger.log('Regenerating page content')
    // Obtener la página con sus bloques y la configuración de IA del módulo
    const page = await this.dbService.page.findUnique({
      where: { id: pageId },
      include: {
        blocks: true,
        module: {
          include: {
            aiConfiguration: true,
          },
        },
      },
    })

    if (!page) {
      throw new NotFoundException(`Página con ID ${pageId} no encontrada`)
    }

    if (page.blocks.length === 0) {
      throw new NotFoundException(`Página con ID ${pageId} no tiene bloques`)
    }

    if (!page.module.aiConfiguration) {
      throw new NotFoundException(
        'Configuración de IA no encontrada para el módulo',
      )
    }

    // Mapear los bloques al formato esperado para el prompt
    const currentBlocks = page.blocks
    // Obtener la configuración de IA
    const {
      audience,
      contentLength,
      language,
      learningObjectives,
      targetLevel,
      tone,
      contextPrompt,
    } = page.module.aiConfiguration

    const config: GeneratePageContentPrompt = {
      title: page.title,
      audience,
      contentLength,
      language,
      learningObjectives,
      targetLevel,
      tone,
      contextPrompt: contextPrompt ?? undefined,
    }

    // Determinar qué prompt usar según si tiene ediciones manuales
    let prompt
    let previousResponseId: string | undefined

    if (page.hasManualEdits || !page.aiResponseId) {
      // Si tiene ediciones manuales, regenerar sin contexto (sin responseId)
      prompt = regenerateWithoutContextPrompt({
        currentBlocks,
        instruction,
        config,
      })
    } else {
      // Si no tiene ediciones manuales, usar el contexto (con responseId)
      prompt = regeneratePageContentWithContextPrompt({
        instruction,
        config,
      })
      previousResponseId = page.aiResponseId ?? undefined
    }

    // Llamar al servicio de OpenAI
    const content = await this.openAiService.getResponse(
      prompt,
      previousResponseId,
    )

    return content
  }
}
