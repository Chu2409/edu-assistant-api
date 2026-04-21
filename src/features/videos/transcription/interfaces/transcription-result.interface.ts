export interface TranscriptionSegment {
  start: number
  end: number
  text: string
}

export interface TranscriptionResult {
  text: string
  language: string
  durationSeconds?: number
  segments?: TranscriptionSegment[]
  source: 'youtube-native' | 'whisper'
}
