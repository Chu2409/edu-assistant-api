import { z } from 'zod'
import { glossarySchema } from '../schemas/glossary.schema'

type Glossary = z.infer<typeof glossarySchema>

function coerceString(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  if (value == null) return ''
  return String(value).trim()
}

export function normalizeGlossary(raw: unknown): Glossary | null {
  if (raw == null || typeof raw !== 'object') return null
  const source = raw as Record<string, unknown>

  const terms: Array<{ term: string; definition: string }> = []
  if (Array.isArray(source.terms)) {
    for (const entry of source.terms) {
      if (!entry || typeof entry !== 'object') continue
      const item = entry as Record<string, unknown>
      const term = coerceString(item.term)
      const definition = coerceString(item.definition)
      if (term.length === 0 || definition.length === 0) continue
      terms.push({ term, definition })
    }
  }

  if (terms.length === 0) return null

  const parsed = glossarySchema.safeParse({ terms })
  return parsed.success ? parsed.data : null
}
