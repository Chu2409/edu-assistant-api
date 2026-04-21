import { SourceKind } from 'src/core/database/generated/client'

export interface TranscriptionInput {
  kind: SourceKind
  url?: string
  filePath?: string
  language?: string
}
