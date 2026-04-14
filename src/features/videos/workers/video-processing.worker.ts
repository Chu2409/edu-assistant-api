import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { Job } from 'bullmq'
import { QUEUE_NAMES } from 'src/shared/constants/queues'
import { DBService } from 'src/core/database/database.service'
import { BlockType, IngestionStatus } from 'src/core/database/generated/client'
import { VideosService } from '../videos.service'
import { TranscriptionService } from '../transcription/transcription.service'
import { VideoContentGeneratorService } from '../ai/video-content-generator.service'

interface ProcessJobData {
  learningObjectId: number
}

interface RetryJobData {
  learningObjectId: number
  contentTypes: BlockType[]
}

@Processor(QUEUE_NAMES.VIDEOS.NAME)
export class VideoProcessingWorker extends WorkerHost {
  private readonly logger = new Logger(VideoProcessingWorker.name)

  constructor(
    private readonly videosService: VideosService,
    private readonly transcriptionService: TranscriptionService,
    private readonly contentGenerator: VideoContentGeneratorService,
    private readonly dbService: DBService,
  ) {
    super()
  }

  async process(job: Job): Promise<unknown> {
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
      await this.videosService.updateStatus(
        learningObjectId,
        IngestionStatus.EXTRACTING,
      )

      const loData =
        await this.videosService.loadForProcessing(learningObjectId)

      const transcription = await this.transcriptionService.transcribe({
        kind: loData.kind,
        url: loData.sourceUrl,
        filePath: loData.kind === 'VIDEO_FILE' ? loData.sourceUrl : undefined,
        language: loData.outputLanguage,
      })

      await this.videosService.persistTranscription(
        learningObjectId,
        transcription,
      )

      await this.videosService.updateStatus(
        learningObjectId,
        IngestionStatus.GENERATING,
      )

      const generated = await this.contentGenerator.generateAll({
        transcription: transcription.text,
        language: transcription.language,
        videoTitle: loData.title,
      })

      await this.dbService.$transaction(async (tx) => {
        await this.videosService.persistGeneratedContent(
          learningObjectId,
          generated,
          tx,
        )
      })

      const processingTimeMs = Date.now() - startedAt

      await this.dbService.generationAttempt.create({
        data: {
          learningObjectId,
          provider: generated.provider ?? 'unknown',
          model: generated.model ?? 'unknown',
          requestedTypes: [
            BlockType.SUMMARY,
            BlockType.FLASHCARDS,
            BlockType.QUIZ,
            BlockType.GLOSSARY,
          ],
          completedTypes:
            generated.errors.length === 0
              ? [
                  BlockType.SUMMARY,
                  BlockType.FLASHCARDS,
                  BlockType.QUIZ,
                  BlockType.GLOSSARY,
                ]
              : [
                  BlockType.SUMMARY,
                  BlockType.FLASHCARDS,
                  BlockType.QUIZ,
                  BlockType.GLOSSARY,
                ].filter((t) => !generated.errors.some((e) => e.type === t)),
          failedTypes:
            generated.errors.length > 0 ? generated.errors : undefined,
          tokensInput: generated.totalTokens.input,
          tokensOutput: generated.totalTokens.output,
          processingTimeMs,
          completedAt: new Date(),
        },
      })

      if (generated.errors.length > 0) {
        await this.videosService.updateStatus(
          learningObjectId,
          IngestionStatus.FAILED,
          {
            errorMessage: `Failed to generate: ${generated.errors.map((e) => e.type).join(', ')}`,
          },
        )
      } else {
        await this.videosService.updateStatus(
          learningObjectId,
          IngestionStatus.COMPLETED,
        )
      }

      this.logger.log(`Video processing completed for LO ${learningObjectId}`)
      return { learningObjectId, success: true }
    } catch (error) {
      this.logger.error(
        `Video processing failed for LO ${learningObjectId}:`,
        error,
      )
      await this.videosService.updateStatus(
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
        await this.videosService.loadForProcessing(learningObjectId)

      if (!loData.rawText) {
        throw new Error('No transcription available for retry')
      }

      const generated = await this.contentGenerator.regenerate(contentTypes, {
        transcription: loData.rawText,
        language: loData.outputLanguage,
        videoTitle: loData.title,
      })

      await this.dbService.$transaction(async (tx) => {
        await this.videosService.persistGeneratedContent(
          learningObjectId,
          generated,
          tx,
        )
      })

      const processingTimeMs = Date.now() - startedAt

      await this.dbService.generationAttempt.create({
        data: {
          learningObjectId,
          provider: generated.provider ?? 'unknown',
          model: generated.model ?? 'unknown',
          requestedTypes: contentTypes,
          completedTypes: contentTypes.filter(
            (t) => !generated.errors.some((e) => e.type === t),
          ),
          failedTypes:
            generated.errors.length > 0 ? generated.errors : undefined,
          tokensInput: generated.totalTokens.input,
          tokensOutput: generated.totalTokens.output,
          processingTimeMs,
          completedAt: new Date(),
        },
      })

      if (generated.errors.length > 0) {
        await this.videosService.updateStatus(
          learningObjectId,
          IngestionStatus.FAILED,
          {
            errorMessage: `Retry failed for: ${generated.errors.map((e) => e.type).join(', ')}`,
          },
        )
      } else {
        await this.videosService.updateStatus(
          learningObjectId,
          IngestionStatus.COMPLETED,
        )
      }

      this.logger.log(`Retry completed for LO ${learningObjectId}`)
      return { learningObjectId, success: true }
    } catch (error) {
      this.logger.error(`Retry failed for LO ${learningObjectId}:`, error)
      await this.videosService.updateStatus(
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
}
