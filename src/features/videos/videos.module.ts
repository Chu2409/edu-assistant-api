import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bullmq'
import { QUEUE_NAMES } from 'src/shared/constants/queues'
import { LearningObjectsModule } from 'src/features/learning-objects/learning-objects.module'
import { VideosController } from './videos.controller'
import { VideosService } from './main/videos.service'
import { VideoIngestionService } from './main/video-ingestion.service'
import { TranscriptionService } from './transcription/transcription.service'
import { YoutubeTranscriptStrategy } from './transcription/strategies/youtube-transcript.strategy'
import { WhisperStrategy } from './transcription/strategies/whisper.strategy'
import { YoutubeFallbackStrategy } from './transcription/strategies/youtube-fallback.strategy'
import { VideoAiProviderService } from './ai/video-ai-provider.service'
import { VideoContentGeneratorService } from './ai/video-content-generator.service'
import { ContentAgentRegistry } from './ai/content-agent.registry'
import { PromptLoaderService } from './ai/config/prompt-loader.service'
import { GenerationAttemptService } from './ai/generation-attempt.service'
import { VideoStateService } from './main/video-state.service'
import { SummaryAgent } from './ai/agents/summary.agent'
import { FlashcardsAgent } from './ai/agents/flashcards.agent'
import { QuizAgent } from './ai/agents/quiz.agent'
import { GlossaryAgent } from './ai/agents/glossary.agent'

@Module({
  imports: [
    BullModule.registerQueue({ name: QUEUE_NAMES.VIDEOS.NAME }),
    LearningObjectsModule,
  ],
  controllers: [VideosController],
  providers: [
    VideosService,
    VideoIngestionService,
    TranscriptionService,
    YoutubeTranscriptStrategy,
    WhisperStrategy,
    YoutubeFallbackStrategy,
    VideoAiProviderService,
    VideoContentGeneratorService,
    ContentAgentRegistry,
    PromptLoaderService,
    GenerationAttemptService,
    VideoStateService,
    SummaryAgent,
    FlashcardsAgent,
    QuizAgent,
    GlossaryAgent,
  ],
  exports: [
    VideosService,
    VideoIngestionService,
    TranscriptionService,
    VideoContentGeneratorService,
    GenerationAttemptService,
    VideoStateService,
  ],
})
export class VideosModule {}
