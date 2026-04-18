import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import {
  BlockType,
  IngestionStatus,
  Prisma,
} from 'src/core/database/generated/client'
import { DBService } from 'src/core/database/database.service'
import { TranscriptionResult } from '../transcription/interfaces/transcription-result.interface'
import { GenerationResult } from '../ai/interfaces/generation-result.interface'
import { GENERATED_BLOCK_TYPES } from '../constants/video.constants'
import { VideoStateService } from './video-state.service'

@Injectable()
export class VideoIngestionService {
  private readonly logger = new Logger(VideoIngestionService.name)

  constructor(
    private readonly dbService: DBService,
    private readonly stateService: VideoStateService,
  ) {}

  async transition(
    videoId: number,
    status: IngestionStatus,
    extra?: { errorMessage?: string | null },
  ): Promise<void> {
    await this.stateService.transition(videoId, status, extra)
  }

  async persistTranscription(
    videoId: number,
    result: TranscriptionResult,
  ): Promise<void> {
    await this.dbService.video.update({
      where: { learningObjectId: videoId },
      data: {
        rawText: result.text,
        detectedLanguage: result.language,
        durationSeconds: result.durationSeconds,
      },
    })
  }

  async persistGeneratedContent(
    videoId: number,
    generated: GenerationResult,
    contentTypes: BlockType[],
    tx: Prisma.TransactionClient,
    orderIndexByType?: Partial<Record<BlockType, number>>,
  ): Promise<void> {
    await tx.block.deleteMany({
      where: {
        learningObjectId: videoId,
        type: { in: contentTypes },
      },
    })

    const blocks = this.buildBlockInputs(videoId, generated, orderIndexByType)

    if (blocks.length > 0) {
      await tx.block.createMany({ data: blocks })
    }
  }

  async loadForProcessing(videoId: number) {
    const lo = await this.dbService.learningObject.findUnique({
      where: { id: videoId },
      include: { video: true },
    })

    if (!lo?.video) {
      throw new NotFoundException(
        `LearningObject ${videoId} has no video source`,
      )
    }

    return {
      title: lo.title,
      kind: lo.video.kind,
      sourceUrl: lo.video.sourceUrl,
      outputLanguage: lo.video.outputLanguage,
      rawText: lo.video.rawText,
    }
  }

  async finalizeGeneration(
    videoId: number,
    generated: GenerationResult,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const client = tx || this.dbService
    if (generated.errors.length > 0) {
      const failedTypes = generated.errors.map((e) => e.type).join(', ')
      await this.stateService.transition(
        videoId,
        IngestionStatus.FAILED,
        { errorMessage: `Failed to generate: ${failedTypes}` },
        client,
      )
    } else {
      await this.stateService.transition(
        videoId,
        IngestionStatus.COMPLETED,
        undefined,
        client,
      )
    }
  }

  private buildBlockInputs(
    videoId: number,
    generated: GenerationResult,
    orderIndexByType?: Partial<Record<BlockType, number>>,
  ): Prisma.BlockCreateManyInput[] {
    const blocks: Prisma.BlockCreateManyInput[] = []

    const entries: Array<{
      type: BlockType
      data: Prisma.InputJsonValue | undefined
    }> = [
      {
        type: BlockType.SUMMARY,
        data: generated.summary as Prisma.InputJsonValue,
      },
      {
        type: BlockType.FLASHCARDS,
        data: generated.flashcards as Prisma.InputJsonValue,
      },
      { type: BlockType.QUIZ, data: generated.quiz as Prisma.InputJsonValue },
      {
        type: BlockType.GLOSSARY,
        data: generated.glossary as Prisma.InputJsonValue,
      },
    ]

    for (const entry of entries) {
      if (entry.data) {
        const orderIndex =
          orderIndexByType?.[entry.type] ??
          GENERATED_BLOCK_TYPES.indexOf(
            entry.type as (typeof GENERATED_BLOCK_TYPES)[number],
          )
        blocks.push({
          learningObjectId: videoId,
          type: entry.type,
          content: entry.data,
          orderIndex,
        })
      }
    }

    return blocks
  }
}
