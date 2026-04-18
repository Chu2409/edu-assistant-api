import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { Job } from 'bullmq'
import { unlink } from 'node:fs/promises'
import { QUEUE_NAMES } from 'src/shared/constants/queues'
import { DBService } from 'src/core/database/database.service'
import {
  BlockType,
  IngestionStatus,
  Prisma,
  SourceKind,
} from 'src/core/database/generated/client'
import { VideoIngestionService } from '../main/video-ingestion.service'
import { TranscriptionService } from '../transcription/transcription.service'
import { VideoContentGeneratorService } from '../ai/video-content-generator.service'
import { GenerationAttemptService } from '../ai/generation-attempt.service'
import { GenerationResult } from '../ai/interfaces/generation-result.interface'
import { GENERATED_BLOCK_TYPES } from '../constants/video.constants'
import { ProcessJobData } from './process-job-data.interface'
import { RetryJobData } from './retry-job-data.interface'

@Processor(QUEUE_NAMES.VIDEOS.NAME)
export class VideoProcessingWorker extends WorkerHost {
  private readonly logger = new Logger(VideoProcessingWorker.name)

  constructor(
    private readonly ingestionService: VideoIngestionService,
    private readonly transcriptionService: TranscriptionService,
    private readonly contentGenerator: VideoContentGeneratorService,
    private readonly attemptService: GenerationAttemptService,
    private readonly dbService: DBService,
  ) {
    super()
  }

  async process(
    job: Job,
  ): Promise<{ videoId: number; success: boolean } | void> {
    switch (job.name) {
      case QUEUE_NAMES.VIDEOS.JOBS.PROCESS:
        return this.handleProcess(job as Job<ProcessJobData>)
      case QUEUE_NAMES.VIDEOS.JOBS.RETRY:
        return this.handleRetry(job as Job<RetryJobData>)
      default:
        this.logger.warn(`Unknown job name: ${job.name}`)
    }
  }

  private async handleProcess(job: Job<ProcessJobData>) {
    const { videoId } = job.data
    const startedAt = Date.now()

    this.logger.log(`Processing video ${videoId}...`)

    let uploadedVideoPath: string | null = null

    try {
      await this.ingestionService.transition(
        videoId,
        IngestionStatus.EXTRACTING,
      )

      const loData = await this.ingestionService.loadForProcessing(videoId)

      if (loData.kind === SourceKind.VIDEO_FILE) {
        uploadedVideoPath = loData.sourceUrl
      }

      const transcription = await this.transcriptionService.transcribe({
        kind: loData.kind,
        url: loData.sourceUrl,
        filePath: loData.kind === 'VIDEO_FILE' ? loData.sourceUrl : undefined,
        language: loData.outputLanguage,
      })

      await this.ingestionService.persistTranscription(videoId, transcription)

      await this.ingestionService.transition(
        videoId,
        IngestionStatus.GENERATING,
      )

      const generated = await this.contentGenerator.generateAll({
        transcription: transcription.text,
        language: transcription.language,
        videoTitle: loData.title,
      })

      await this.persistAndFinalize(
        videoId,
        [...GENERATED_BLOCK_TYPES],
        generated,
        startedAt,
      )

      this.logger.log(`Video processing completed for ${videoId}`)
      return { videoId, success: true }
    } catch (error) {
      this.logger.error(`Video processing failed for ${videoId}:`, error)
      await this.ingestionService.transition(videoId, IngestionStatus.FAILED, {
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      })
      throw error
    } finally {
      if (uploadedVideoPath) {
        try {
          await unlink(uploadedVideoPath)
        } catch (err) {
          this.logger.warn(
            `Failed to remove uploaded video file ${uploadedVideoPath}: ${err instanceof Error ? err.message : String(err)}`,
          )
        }
      }
    }
  }

  private async handleRetry(job: Job<RetryJobData>) {
    const { videoId, contentTypes, instruction } = job.data
    const startedAt = Date.now()

    this.logger.log(
      `Retrying content generation for video ${videoId}: ${contentTypes.join(', ')}${instruction ? ' (with instruction)' : ''}`,
    )

    try {
      const loData = await this.ingestionService.loadForProcessing(videoId)

      if (!loData.rawText) {
        throw new Error('No transcription available for retry')
      }

      const previousBlocks = await this.dbService.block.findMany({
        where: {
          learningObjectId: videoId,
          type: { in: contentTypes },
        },
        select: { type: true, content: true, orderIndex: true },
      })

      const previousContent: Record<string, Prisma.InputJsonValue> = {}
      const orderIndexByType: Partial<Record<BlockType, number>> = {}
      for (const block of previousBlocks) {
        previousContent[block.type] = block.content as Prisma.InputJsonValue
        orderIndexByType[block.type] = block.orderIndex
      }

      const generated = await this.contentGenerator.regenerate(contentTypes, {
        transcription: loData.rawText,
        language: loData.outputLanguage,
        videoTitle: loData.title,
        instruction,
      })

      await this.persistAndFinalize(
        videoId,
        contentTypes,
        generated,
        startedAt,
        { instruction, previousContent, orderIndexByType },
      )

      this.logger.log(`Retry completed for video ${videoId}`)
      return { videoId, success: true }
    } catch (error) {
      this.logger.error(`Retry failed for video ${videoId}:`, error)
      await this.ingestionService.transition(videoId, IngestionStatus.FAILED, {
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      })
      throw error
    }
  }

  private async persistAndFinalize(
    videoId: number,
    requestedTypes: RetryJobData['contentTypes'],
    generated: GenerationResult,
    startedAt: number,
    audit?: {
      instruction?: string
      previousContent?: Record<string, Prisma.InputJsonValue>
      orderIndexByType?: Partial<Record<BlockType, number>>
    },
  ): Promise<void> {
    await this.dbService.$transaction(async (tx) => {
      await this.ingestionService.persistGeneratedContent(
        videoId,
        generated,
        requestedTypes,
        tx,
        audit?.orderIndexByType,
      )
      await this.ingestionService.finalizeGeneration(videoId, generated, tx)
    })

    await this.attemptService.record(
      videoId,
      requestedTypes,
      generated,
      Date.now() - startedAt,
      audit,
    )
  }
}
