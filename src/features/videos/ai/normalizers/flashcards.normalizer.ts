import { z } from 'zod'
import { flashcardsSchema } from '../schemas/flashcards.schema'

type Flashcards = z.infer<typeof flashcardsSchema>

function coerceString(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value).trim()
  }
  return ''
}

export function normalizeFlashcards(raw: unknown): Flashcards | null {
  if (raw == null || typeof raw !== 'object') return null
  const source = raw as Record<string, unknown>

  const items: Array<{ front: string; back: string }> = []
  if (Array.isArray(source.items)) {
    for (const entry of source.items) {
      if (!entry || typeof entry !== 'object') continue
      const item = entry as Record<string, unknown>
      const front = coerceString(item.front)
      const back = coerceString(item.back)
      if (front.length === 0 || back.length === 0) continue
      items.push({ front, back })
    }
  }

  if (items.length === 0) return null

  const parsed = flashcardsSchema.safeParse({ items })
  return parsed.success ? parsed.data : null
}
