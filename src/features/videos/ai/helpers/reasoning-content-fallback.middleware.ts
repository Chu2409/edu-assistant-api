import type { LanguageModelMiddleware } from 'ai'
import { extractJsonTransform } from './extract-json-transform'

export const reasoningContentFallbackMiddleware: LanguageModelMiddleware = {
  specificationVersion: 'v3',
  wrapGenerate: async ({ doGenerate }) => {
    const result = await doGenerate()

    const textParts = result.content.filter(
      (part): part is Extract<typeof part, { type: 'text' }> =>
        part.type === 'text',
    )
    const hasNonEmptyText = textParts.some(
      (part) => part.text.trim().length > 0,
    )
    if (hasNonEmptyText) return result

    const reasoningParts = result.content.filter(
      (part): part is Extract<typeof part, { type: 'reasoning' }> =>
        part.type === 'reasoning',
    )
    const combinedReasoning = reasoningParts
      .map((part) => part.text)
      .join('\n')
      .trim()
    if (!combinedReasoning) return result

    const extracted = extractJsonTransform(combinedReasoning)
    if (!extracted) return result

    return {
      ...result,
      content: [
        ...result.content.filter((part) => part.type !== 'text'),
        { type: 'text', text: extracted },
      ],
    }
  },
}
