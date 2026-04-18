import { Injectable, Logger, HttpStatus } from '@nestjs/common'
import { fetchTranscript } from 'youtube-transcript-plus'
import { ITranscriptionStrategy } from '../interfaces/transcription-strategy.interface'
import { TranscriptionInput } from '../interfaces/transcription-input.interface'
import { TranscriptionResult } from '../interfaces/transcription-result.interface'
import { extractYoutubeVideoId } from '../utils/youtube-url.util'
import { BusinessException } from 'src/shared/exceptions/business.exception'

@Injectable()
export class YoutubeTranscriptStrategy implements ITranscriptionStrategy {
  private readonly logger = new Logger(YoutubeTranscriptStrategy.name)

  async transcribe(input: TranscriptionInput): Promise<TranscriptionResult> {
    const videoId = extractYoutubeVideoId(input.url ?? '')
    if (!videoId) {
      throw new BusinessException('Invalid YouTube URL', HttpStatus.BAD_REQUEST)
    }

    const lang = input.language === 'auto' ? undefined : input.language
    this.logger.log(
      `Fetching YouTube transcript for ${videoId} (lang=${lang ?? 'auto'})`,
    )

    const items = await fetchTranscript(videoId, lang ? { lang } : undefined)

    if (items.length === 0) {
      throw new BusinessException(
        'No transcript available for this video',
        HttpStatus.UNPROCESSABLE_ENTITY,
      )
    }

    const text = items.map((item) => item.text).join(' ')
    const lastItem = items[items.length - 1]
    const durationSeconds = (lastItem.offset + lastItem.duration) / 1000
    const detectedLang =
      items[0].lang ??
      (input.language === 'auto' ? 'en' : (input.language ?? 'en'))

    this.logger.log(
      `YouTube transcript OK: ${items.length} segments, ${text.length} chars, lang=${detectedLang}, duration=${Math.round(durationSeconds)}s`,
    )

    const segments = items.map((item) => ({
      start: item.offset / 1000,
      end: (item.offset + item.duration) / 1000,
      text: item.text,
    }))

    return {
      text,
      language: detectedLang,
      durationSeconds,
      segments,
      source: 'youtube-native',
    }
  }
}
