import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { Job } from 'bullmq'
import { QUEUE_NAMES } from 'src/shared/constants/queues'
import { DBService } from 'src/core/database/database.service'
import { IngestionStatus } from 'src/core/database/generated/client'
import { VideoIngestionService } from '../video-ingestion.service'
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
  ): Promise<{ learningObjectId: number; success: boolean } | void> {
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
    const { learningObjectId } = job.data
    const startedAt = Date.now()

    this.logger.log(`Processing video for LO ${learningObjectId}...`)

    try {
      await this.ingestionService.updateStatus(
        learningObjectId,
        IngestionStatus.EXTRACTING,
      )

      const loData =
        await this.ingestionService.loadForProcessing(learningObjectId)

      const transcription = await this.transcriptionService.transcribe({
        kind: loData.kind,
        url: loData.sourceUrl,
        filePath: loData.kind === 'VIDEO_FILE' ? loData.sourceUrl : undefined,
        language: loData.outputLanguage,
      })

      await this.ingestionService.persistTranscription(
        learningObjectId,
        transcription,
      )

      await this.ingestionService.updateStatus(
        learningObjectId,
        IngestionStatus.GENERATING,
      )

      const generated = await this.contentGenerator.generateAll({
        transcription: transcription.text,
        language: transcription.language,
        videoTitle: loData.title,
      })

      await this.persistAndFinalize(
        learningObjectId,
        [...GENERATED_BLOCK_TYPES],
        generated,
        startedAt,
      )

      this.logger.log(`Video processing completed for LO ${learningObjectId}`)
      return { learningObjectId, success: true }
    } catch (error) {
      this.logger.error(
        `Video processing failed for LO ${learningObjectId}:`,
        error,
      )
      await this.ingestionService.updateStatus(
        learningObjectId,
        IngestionStatus.FAILED,
        {
          errorMessage:
            error instanceof Error ? error.message : 'Unknown error',
        },
      )
      throw error
    }
  }

  private async handleRetry(job: Job<RetryJobData>) {
    const { learningObjectId, contentTypes } = job.data
    const startedAt = Date.now()

    this.logger.log(
      `Retrying content generation for LO ${learningObjectId}: ${contentTypes.join(', ')}`,
    )

    try {
      const loData =
        await this.ingestionService.loadForProcessing(learningObjectId)

      if (!loData.rawText) {
        throw new Error('No transcription available for retry')
      }

      const generated = await this.contentGenerator.regenerate(contentTypes, {
        transcription: loData.rawText,
        language: loData.outputLanguage,
        videoTitle: loData.title,
      })

      await this.persistAndFinalize(
        learningObjectId,
        contentTypes,
        generated,
        startedAt,
      )

      this.logger.log(`Retry completed for LO ${learningObjectId}`)
      return { learningObjectId, success: true }
    } catch (error) {
      this.logger.error(`Retry failed for LO ${learningObjectId}:`, error)
      await this.ingestionService.updateStatus(
        learningObjectId,
        IngestionStatus.FAILED,
        {
          errorMessage:
            error instanceof Error ? error.message : 'Unknown error',
        },
      )
      throw error
    }
  }

  private async persistAndFinalize(
    learningObjectId: number,
    requestedTypes: RetryJobData['contentTypes'],
    generated: GenerationResult,
    startedAt: number,
  ): Promise<void> {
    await this.dbService.$transaction(async (tx) => {
      await this.ingestionService.persistGeneratedContent(
        learningObjectId,
        generated,
        tx,
      )
    })

    await this.attemptService.record(
      learningObjectId,
      requestedTypes,
      generated,
      Date.now() - startedAt,
    )

    await this.ingestionService.finalizeGeneration(learningObjectId, generated)
  }
}
