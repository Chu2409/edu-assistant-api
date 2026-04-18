import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { nodewhisper } from 'nodejs-whisper'
import { ITranscriptionStrategy } from '../interfaces/transcription-strategy.interface'
import { TranscriptionInput } from '../interfaces/transcription-input.interface'
import { TranscriptionResult } from '../interfaces/transcription-result.interface'
import { IConfig } from 'src/core/config/types'

@Injectable()
export class WhisperStrategy implements ITranscriptionStrategy {
  constructor(private readonly configService: ConfigService) {}

  async transcribe(input: TranscriptionInput): Promise<TranscriptionResult> {
    const filePath = input.filePath ?? input.url ?? ''
    const modelName =
      this.configService.get<IConfig['WHISPER_MODEL']>('APP.WHISPER_MODEL') ??
      'base'

    const result = await nodewhisper(filePath, {
      modelName,
      autoDownloadModelName: modelName,
      removeWavFileAfterTranscription: true,
    })

    const text = typeof result === 'string' ? result : String(result)

    return {
      text: text.trim(),
      language: input.language === 'auto' ? 'en' : (input.language ?? 'en'),
      source: 'whisper',
    }
  }
}
