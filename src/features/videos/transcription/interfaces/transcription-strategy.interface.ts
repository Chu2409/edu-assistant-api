import { TranscriptionInput } from './transcription-input.interface'
import { TranscriptionResult } from './transcription-result.interface'

export interface ITranscriptionStrategy {
  transcribe(input: TranscriptionInput): Promise<TranscriptionResult>
}
