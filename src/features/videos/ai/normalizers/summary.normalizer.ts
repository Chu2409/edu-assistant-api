import { z } from 'zod'
import { summarySchema } from '../schemas/summary.schema'

type Summary = z.infer<typeof summarySchema>

function coerceStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .map((entry) => {
      if (typeof entry === 'string') return entry
      if (typeof entry === 'number' || typeof entry === 'boolean') {
        return String(entry)
      }
      return ''
    })
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
}

function coerceString(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value).trim()
  }
  return ''
}

export function normalizeSummary(raw: unknown): Summary | null {
  if (raw == null || typeof raw !== 'object') return null
  const source = raw as Record<string, unknown>

  const normalized: Summary = {
    title: coerceString(source.title),
    whatYouLearn: coerceStringArray(source.whatYouLearn),
    keyConcepts: coerceStringArray(source.keyConcepts),
    examples: coerceStringArray(source.examples),
    summary: coerceString(source.summary),
  }

  const everythingEmpty =
    normalized.title === '' &&
    normalized.summary === '' &&
    normalized.whatYouLearn.length === 0 &&
    normalized.keyConcepts.length === 0 &&
    normalized.examples.length === 0

  if (everythingEmpty) return null

  const parsed = summarySchema.safeParse(normalized)
  return parsed.success ? parsed.data : null
}
