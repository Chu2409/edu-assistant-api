import { jsonrepair } from 'jsonrepair'

const FENCED_BLOCK_REGEX = /```(?:json|JSON)?\s*\n?([\s\S]*?)\n?\s*```/
const FIRST_JSON_OBJECT_REGEX = /\{[\s\S]*\}|\[[\s\S]*\]/

const stripMarkdownFences = (text: string): string => {
  const trimmed = text.trim()
  const fenced = trimmed.match(FENCED_BLOCK_REGEX)
  if (fenced) return fenced[1].trim()
  const firstJson = trimmed.match(FIRST_JSON_OBJECT_REGEX)
  if (firstJson) return firstJson[0].trim()
  return trimmed
}

export const extractJsonTransform = (text: string): string => {
  const stripped = stripMarkdownFences(text)
  try {
    return jsonrepair(stripped)
  } catch {
    return stripped
  }
}
