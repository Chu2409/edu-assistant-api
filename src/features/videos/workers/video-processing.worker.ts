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

    try {
      await this.ingestionService.transition(
        videoId,
        IngestionStatus.EXTRACTING,
      )

      const loData = await this.ingestionService.loadForProcessing(videoId)

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
    }
  }

  private async handleRetry(job: Job<RetryJobData>) {
    const { videoId, contentTypes } = job.data
    const startedAt = Date.now()

    this.logger.log(
      `Retrying content generation for video ${videoId}: ${contentTypes.join(', ')}`,
    )

    try {
      const loData = await this.ingestionService.loadForProcessing(videoId)

      if (!loData.rawText) {
        throw new Error('No transcription available for retry')
      }

      const generated = await this.contentGenerator.regenerate(contentTypes, {
        transcription: loData.rawText,
        language: loData.outputLanguage,
        videoTitle: loData.title,
      })

      await this.persistAndFinalize(videoId, contentTypes, generated, startedAt)

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
  ): Promise<void> {
    await this.dbService.$transaction(async (tx) => {
      await this.ingestionService.persistGeneratedContent(
        videoId,
        generated,
        tx,
      )
      await this.ingestionService.finalizeGeneration(videoId, generated, tx)
    })

    await this.attemptService.record(
      videoId,
      requestedTypes,
      generated,
      Date.now() - startedAt,
    )
  }
}
