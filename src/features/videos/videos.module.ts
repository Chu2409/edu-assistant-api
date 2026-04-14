import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bullmq'
import { QUEUE_NAMES } from 'src/shared/constants/queues'
import { VideosController } from './videos.controller'
import { VideosService } from './videos.service'
import { TranscriptionService } from './transcription/transcription.service'
import { YoutubeTranscriptStrategy } from './transcription/strategies/youtube-transcript.strategy'
import { WhisperStrategy } from './transcription/strategies/whisper.strategy'
import { YoutubeFallbackStrategy } from './transcription/strategies/youtube-fallback.strategy'
import { VideoAiProviderService } from './ai/video-ai-provider.service'
import { VideoContentGeneratorService } from './ai/video-content-generator.service'
import { ContentAgentFactory } from './ai/content-agent.factory'
import { PromptLoaderService } from './ai/config/prompt-loader.service'

@Module({
  imports: [BullModule.registerQueue({ name: QUEUE_NAMES.VIDEOS.NAME })],
  controllers: [VideosController],
  providers: [
    VideosService,
    TranscriptionService,
    YoutubeTranscriptStrategy,
    WhisperStrategy,
    YoutubeFallbackStrategy,
    VideoAiProviderService,
    VideoContentGeneratorService,
    ContentAgentFactory,
    PromptLoaderService,
  ],
  exports: [VideosService],
})
export class VideosModule {}
