import { Injectable, Logger } from '@nestjs/common'
import { tmpdir } from 'os'
import { unlink } from 'fs/promises'
import { ITranscriptionStrategy } from '../interfaces/transcription-strategy.interface'
import { TranscriptionInput } from '../interfaces/transcription-input.interface'
import { TranscriptionResult } from '../interfaces/transcription-result.interface'
import { YoutubeTranscriptStrategy } from './youtube-transcript.strategy'
import { WhisperStrategy } from './whisper.strategy'
import { downloadAudio } from '../utils/video-download.util'

@Injectable()
export class YoutubeFallbackStrategy implements ITranscriptionStrategy {
  private readonly logger = new Logger(YoutubeFallbackStrategy.name)

  constructor(
    private readonly youtubeTranscript: YoutubeTranscriptStrategy,
    private readonly whisper: WhisperStrategy,
  ) {}

  async transcribe(input: TranscriptionInput): Promise<TranscriptionResult> {
    try {
      return await this.youtubeTranscript.transcribe(input)
    } catch {
      this.logger.warn(
        `YouTube native transcript failed for ${input.url}, falling back to Whisper`,
      )
    }

    let audioPath: string | undefined
    try {
      audioPath = await downloadAudio(input.url ?? '', tmpdir())
      return await this.whisper.transcribe({
        ...input,
        filePath: audioPath,
      })
    } finally {
      if (audioPath) {
        await unlink(audioPath).catch(() => {})
      }
    }
  }
}
