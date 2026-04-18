import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import {
  BlockType,
  IngestionStatus,
  Prisma,
} from 'src/core/database/generated/client'
import { DBService } from 'src/core/database/database.service'
import { TranscriptionResult } from './transcription/interfaces/transcription-result.interface'
import { GenerationResult } from './ai/interfaces/generation-result.interface'
import { GENERATED_BLOCK_TYPES } from './constants/video.constants'

@Injectable()
export class VideoIngestionService {
  private readonly logger = new Logger(VideoIngestionService.name)

  constructor(private readonly dbService: DBService) {}

  async updateStatus(
    learningObjectId: number,
    status: IngestionStatus,
    extra?: { errorMessage?: string },
  ): Promise<void> {
    await this.dbService.contentSource.update({
      where: { learningObjectId },
      data: { status, errorMessage: extra?.errorMessage },
    })
  }

  async persistTranscription(
    learningObjectId: number,
    result: TranscriptionResult,
  ): Promise<void> {
    await this.dbService.contentSource.update({
      where: { learningObjectId },
      data: {
        rawText: result.text,
        detectedLanguage: result.language,
        durationSeconds: result.durationSeconds,
      },
    })
  }

  async persistGeneratedContent(
    learningObjectId: number,
    generated: GenerationResult,
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    await tx.block.deleteMany({
      where: {
        learningObjectId,
        type: { in: [...GENERATED_BLOCK_TYPES] },
      },
    })

    const blocks = this.buildBlockInputs(learningObjectId, generated)

    if (blocks.length > 0) {
      await tx.block.createMany({ data: blocks })
    }
  }

  async loadForProcessing(learningObjectId: number) {
    const lo = await this.dbService.learningObject.findUnique({
      where: { id: learningObjectId },
      include: { contentSource: true },
    })

    if (!lo?.contentSource) {
      throw new NotFoundException(
        `LearningObject ${learningObjectId} has no content source`,
      )
    }

    return {
      title: lo.title,
      kind: lo.contentSource.kind,
      sourceUrl: lo.contentSource.sourceUrl,
      outputLanguage: lo.contentSource.outputLanguage,
      rawText: lo.contentSource.rawText,
    }
  }

  async finalizeGeneration(
    learningObjectId: number,
    generated: GenerationResult,
  ): Promise<void> {
    if (generated.errors.length > 0) {
      const failedTypes = generated.errors.map((e) => e.type).join(', ')
      await this.updateStatus(learningObjectId, IngestionStatus.FAILED, {
        errorMessage: `Failed to generate: ${failedTypes}`,
      })
    } else {
      await this.updateStatus(learningObjectId, IngestionStatus.COMPLETED)
    }
  }

  private buildBlockInputs(
    learningObjectId: number,
    generated: GenerationResult,
  ): Prisma.BlockCreateManyInput[] {
    const blocks: Prisma.BlockCreateManyInput[] = []
    let orderIndex = 0

    const entries: Array<{
      type: BlockType
      data: Prisma.InputJsonValue | undefined
    }> = [
      { type: BlockType.SUMMARY, data: generated.summary as Prisma.InputJsonValue },
      { type: BlockType.FLASHCARDS, data: generated.flashcards as Prisma.InputJsonValue },
      { type: BlockType.QUIZ, data: generated.quiz as Prisma.InputJsonValue },
      { type: BlockType.GLOSSARY, data: generated.glossary as Prisma.InputJsonValue },
    ]

    for (const entry of entries) {
      if (entry.data) {
        blocks.push({
          learningObjectId,
          type: entry.type,
          content: entry.data,
          orderIndex: orderIndex++,
        })
      }
    }

    return blocks
  }
}
