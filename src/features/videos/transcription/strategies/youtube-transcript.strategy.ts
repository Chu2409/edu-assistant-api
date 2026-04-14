import { Injectable } from '@nestjs/common'
import { YoutubeTranscript } from 'youtube-transcript'
import { ITranscriptionStrategy } from '../interfaces/transcription-strategy.interface'
import { TranscriptionInput } from '../interfaces/transcription-input.interface'
import { TranscriptionResult } from '../interfaces/transcription-result.interface'
import { extractYoutubeVideoId } from '../utils/youtube-url.util'
import { HttpStatus } from '@nestjs/common'
import { BusinessException } from 'src/shared/exceptions/business.exception'

@Injectable()
export class YoutubeTranscriptStrategy implements ITranscriptionStrategy {
  async transcribe(input: TranscriptionInput): Promise<TranscriptionResult> {
    const videoId = extractYoutubeVideoId(input.url ?? '')
    if (!videoId) {
      throw new BusinessException('Invalid YouTube URL', HttpStatus.BAD_REQUEST)
    }

    const items = await YoutubeTranscript.fetchTranscript(videoId)

    if (items.length === 0) {
      throw new BusinessException(
        'No transcript available for this video',
        HttpStatus.UNPROCESSABLE_ENTITY,
      )
    }

    const text = items.map((item) => item.text).join(' ')
    const lastItem = items[items.length - 1]
    const durationSeconds = lastItem.offset / 1000 + lastItem.duration / 1000

    const segments = items.map((item) => ({
      start: item.offset / 1000,
      end: (item.offset + item.duration) / 1000,
      text: item.text,
    }))

    return {
      text,
      language: input.language === 'auto' ? 'en' : (input.language ?? 'en'),
      durationSeconds,
      segments,
      source: 'youtube-native',
    }
  }
}
