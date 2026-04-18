import { z } from 'zod'
import { quizSchema } from '../schemas/quiz.schema'

type Quiz = z.infer<typeof quizSchema>
type Question = Quiz['questions'][number]

const OPTIONS_COUNT = 4
const MAX_ANSWER_INDEX = OPTIONS_COUNT - 1

function coerceString(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  if (value == null) return ''
  return String(value).trim()
}

function coerceOptions(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null
  const strings = value.map(coerceString).filter((option) => option.length > 0)
  if (strings.length < 2) return null
  const trimmed = strings.slice(0, OPTIONS_COUNT)
  while (trimmed.length < OPTIONS_COUNT) trimmed.push('—')
  return trimmed
}

function coerceAnswerIndex(value: unknown): number | null {
  const asNumber =
    typeof value === 'number' ? value : Number.parseInt(String(value), 10)
  if (!Number.isFinite(asNumber)) return null
  const rounded = Math.trunc(asNumber)
  if (rounded < 0 || rounded > MAX_ANSWER_INDEX) return null
  return rounded
}

export function normalizeQuiz(raw: unknown): Quiz | null {
  if (raw == null || typeof raw !== 'object') return null
  const source = raw as Record<string, unknown>
  if (!Array.isArray(source.questions)) return null

  const questions: Question[] = []
  for (const entry of source.questions) {
    if (!entry || typeof entry !== 'object') continue
    const q = entry as Record<string, unknown>

    const question = coerceString(q.question)
    if (question.length === 0) continue

    const options = coerceOptions(q.options)
    if (!options) continue

    const correctAnswer = coerceAnswerIndex(q.correctAnswer)
    if (correctAnswer === null) continue

    const explanation = coerceString(q.explanation)

    questions.push({ question, options, correctAnswer, explanation })
  }

  if (questions.length === 0) return null

  const parsed = quizSchema.safeParse({ questions })
  return parsed.success ? parsed.data : null
}
