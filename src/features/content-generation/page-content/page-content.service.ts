import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { DBService } from 'src/core/database/database.service'
import { OpenaiService } from 'src/providers/ai/services/openai.service'
import { generatePageContentPrompt } from './prompts/generate-page-content.prompt'
import { regeneratePageContentPrompt } from './prompts/regenerate-page-content.prompt'
import { regenerateBlockPrompt } from './prompts/regenerate-block.prompt'
import { expandContentPrompt } from './prompts/expand-content.prompt'
import { GenerateContentDto } from './dtos/req/generate-content.dto'
import { RegenerateContentDto } from './dtos/req/regenerate-content.dto'
import { RegenerateBlockDto } from './dtos/req/regenerate-block.dto'
import { ExpandContentDto } from './dtos/req/expand-content.dto'
import { GeneratedLoContent } from './dtos/res/generated-lo-content.dto'
import { RegeneratedBlockDto } from './dtos/res/regenerated-block.dto'
import { ExpandedContentDto } from './dtos/res/expanded-content.dto'
import type { AiContent } from '../shared/interfaces/ai-generated-content.interface'
import { parseJsonField } from 'src/providers/ai/helpers/utils'
import { validateAiResponse } from 'src/providers/ai/helpers/ai-response-validator'
import {
  generatedPageContentSchema,
  regeneratedBlockSchema,
  expandedContentSchema,
} from '../shared/schemas/ai-content.schema'

@Injectable()
export class PageContentService {
  private readonly logger = new Logger(PageContentService.name)

  constructor(
    private readonly dbService: DBService,
    private readonly openAiService: OpenaiService,
  ) {}

  async generatePageContent(
    data: GenerateContentDto,
  ): Promise<GeneratedLoContent> {
    this.logger.log('Generating page content')

    const page = await this.dbService.learningObject.findUnique({
      where: { id: data.pageId },
      include: { module: { include: { aiConfiguration: true } } },
    })

    if (!page) {
      throw new NotFoundException(`Page with id ${data.pageId} not found`)
    }

    const prompt = generatePageContentPrompt({
      title: page.title,
      instructions: data.instructions,
      config: {
        audience: data.audience ?? page.module.aiConfiguration!.audience,
        contentLength:
          data.contentLength ?? page.module.aiConfiguration!.contentLength,
        language: data.language ?? page.module.aiConfiguration!.language,
        targetLevel:
          data.targetLevel ?? page.module.aiConfiguration!.targetLevel,
        tone: data.tone ?? page.module.aiConfiguration!.tone,
      },
    })
    const aiResponse =
      await this.openAiService.getResponse<GeneratedLoContent>(prompt)

    return validateAiResponse(aiResponse.content, generatedPageContentSchema)
  }

  async regeneratePageContent(
    data: RegenerateContentDto,
  ): Promise<GeneratedLoContent> {
    this.logger.log('Regenerating page content')

    const page = await this.dbService.learningObject.findUnique({
      where: { id: data.pageId },
      include: {
        blocks: {
          orderBy: {
            orderIndex: 'asc',
          },
        },
        module: { include: { aiConfiguration: true } },
      },
    })

    if (!page) {
      throw new NotFoundException(`Page with id ${data.pageId} not found`)
    }

    const blocks = page.blocks.map((b) => ({
      type: b.type,
      content: parseJsonField<AiContent>(b.content),
    }))

    const prompt = regeneratePageContentPrompt({
      title: page.title,
      instructions: data.instructions,
      blocks,
      config: {
        audience: data.audience ?? page.module.aiConfiguration!.audience,
        contentLength:
          data.contentLength ?? page.module.aiConfiguration!.contentLength,
        language: data.language ?? page.module.aiConfiguration!.language,
        targetLevel:
          data.targetLevel ?? page.module.aiConfiguration!.targetLevel,
        tone: data.tone ?? page.module.aiConfiguration!.tone,
      },
    })

    const aiResponse =
      await this.openAiService.getResponse<GeneratedLoContent>(prompt)

    return validateAiResponse(aiResponse.content, generatedPageContentSchema)
  }

  async regenerateBlock(
    data: RegenerateBlockDto,
  ): Promise<RegeneratedBlockDto> {
    this.logger.log('Regenerating block')

    const page = await this.dbService.learningObject.findUnique({
      where: { id: data.pageId },
      include: {
        blocks: { orderBy: { orderIndex: 'asc' } },
        module: { include: { aiConfiguration: true } },
      },
    })

    if (!page) {
      throw new NotFoundException(`Page with id ${data.pageId} not found`)
    }

    const blockIndex = page.blocks.findIndex(
      (b) => b.orderIndex === data.orderIndex,
    )

    if (blockIndex === -1) {
      throw new NotFoundException(
        `Block with orderIndex ${data.orderIndex} not found in page ${data.pageId}`,
      )
    }

    const block = page.blocks[blockIndex]
    const previousBlock =
      blockIndex > 0 ? page.blocks[blockIndex - 1] : undefined
    const nextBlock =
      blockIndex < page.blocks.length - 1
        ? page.blocks[blockIndex + 1]
        : undefined

    const config = {
      audience: data.audience ?? page.module.aiConfiguration!.audience,
      language: data.language ?? page.module.aiConfiguration!.language,
      targetLevel: data.targetLevel ?? page.module.aiConfiguration!.targetLevel,
      tone: data.tone ?? page.module.aiConfiguration!.tone,
    }

    const prompt = regenerateBlockPrompt({
      blockIndex,
      block: {
        type: block.type,
        content: parseJsonField(block.content),
      },
      instruction: data.instruction,
      context: {
        pageTitle: page.title,
        previousBlock: previousBlock
          ? {
              type: previousBlock.type,
              content: parseJsonField(previousBlock.content),
            }
          : undefined,
        nextBlock: nextBlock
          ? {
              type: nextBlock.type,
              content: parseJsonField(nextBlock.content),
            }
          : undefined,
      },
      config: {
        language: config.language,
        targetLevel: config.targetLevel,
        audience: config.audience,
        tone: config.tone,
      },
    })

    const aiResponse =
      await this.openAiService.getResponse<RegeneratedBlockDto>(prompt)

    return validateAiResponse(aiResponse.content, regeneratedBlockSchema)
  }

  async expandContent(data: ExpandContentDto): Promise<ExpandedContentDto> {
    this.logger.log('Expanding content')

    const page = await this.dbService.learningObject.findUnique({
      where: { id: data.pageId },
      include: {
        blocks: { orderBy: { orderIndex: 'asc' } },
        module: { include: { aiConfiguration: true } },
      },
    })

    if (!page) {
      throw new NotFoundException(`Page with id ${data.pageId} not found`)
    }

    let targetBlockIndex: number | undefined = undefined
    if (data.targetOrderIndex !== undefined) {
      targetBlockIndex = page.blocks.findIndex(
        (b) => b.orderIndex === data.targetOrderIndex,
      )
      if (targetBlockIndex === -1) {
        throw new NotFoundException(
          `Target block with orderIndex ${data.targetOrderIndex} not found`,
        )
      }
    }

    const existingBlocks = page.blocks.map((b) => ({
      type: b.type,
      content: parseJsonField<AiContent>(b.content),
    }))

    const config = {
      audience: page.module.aiConfiguration!.audience,
      language: page.module.aiConfiguration!.language,
      targetLevel: page.module.aiConfiguration!.targetLevel,
      tone: page.module.aiConfiguration!.tone,
    }

    const prompt = expandContentPrompt({
      existingBlocks,
      instruction: data.instruction,
      insertPosition: data.insertPosition as 'before' | 'after' | 'replace',
      targetBlockIndex,
      config: {
        language: config.language,
        targetLevel: config.targetLevel,
        audience: config.audience,
        tone: config.tone,
      },
    })

    const aiResponse =
      await this.openAiService.getResponse<ExpandedContentDto>(prompt)

    return validateAiResponse(aiResponse.content, expandedContentSchema)
  }

  async generateImage(prompt: string, language?: string) {
    this.logger.log('Generating image')
    const finalPrompt = language
      ? `${prompt}. Any text or labels within the image MUST be explicitly written in ${language} language.`
      : prompt

    const image = await this.openAiService.generateImage(finalPrompt)

    return image
  }
}
