import { Injectable } from '@nestjs/common'
import { SourceKind } from 'src/core/database/generated/client'
import { HttpStatus } from '@nestjs/common'
import { BusinessException } from 'src/shared/exceptions/business.exception'
import { ITranscriptionStrategy } from './interfaces/transcription-strategy.interface'
import { TranscriptionInput } from './interfaces/transcription-input.interface'
import { TranscriptionResult } from './interfaces/transcription-result.interface'
import { YoutubeFallbackStrategy } from './strategies/youtube-fallback.strategy'
import { WhisperStrategy } from './strategies/whisper.strategy'

@Injectable()
export class TranscriptionService {
  private readonly strategyMap: Map<SourceKind, ITranscriptionStrategy>

  constructor(
    youtubeFallback: YoutubeFallbackStrategy,
    whisper: WhisperStrategy,
  ) {
    this.strategyMap = new Map<SourceKind, ITranscriptionStrategy>([
      [SourceKind.YOUTUBE_URL, youtubeFallback],
      [SourceKind.VIDEO_FILE, whisper],
    ])
  }

  async transcribe(input: TranscriptionInput): Promise<TranscriptionResult> {
    const strategy = this.strategyMap.get(input.kind)

    if (!strategy) {
      throw new BusinessException(
        `No transcription strategy registered for source kind: ${input.kind}`,
        HttpStatus.BAD_REQUEST,
      )
    }

    return strategy.transcribe(input)
  }
}
