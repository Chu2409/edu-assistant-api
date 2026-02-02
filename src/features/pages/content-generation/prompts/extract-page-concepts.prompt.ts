import { PromptInput } from '../interfaces/prompt-input.interface'
import { AiTextBlock } from '../interfaces/ai-generated-content.interface'

export interface ExtractPageConceptsPrompt {
  blocks: AiTextBlock[]
  config: {
    language: string
    maxTerms?: number
    maxDefinitionLength?: number
  }
}

export const extractPageConceptsPrompt = ({
  blocks,
  config,
}: ExtractPageConceptsPrompt): PromptInput[] => {
  const { language = 'es', maxTerms = 8, maxDefinitionLength = 120 } = config

  return [
    {
      role: 'system',
      content: `You are an expert educational content analyzer that extracts key terms for student tooltips.

# OUTPUT FORMAT

Return ONLY raw JSON (no markdown fences, no explanation):

{
  "terms": [
    { "term": "exact term", "definition": "brief definition" }
  ]
}

# CONSTRAINTS

1. MAXIMUM ${maxTerms} terms. You may return fewer if the content doesn't have enough valuable terms. NEVER exceed ${maxTerms}.
2. Each definition MUST be under ${maxDefinitionLength} characters.
3. Terms MUST appear VERBATIM in the source text.

# TERM SELECTION

## Requirements
- Must appear exactly as written in text (case-insensitive)
- Preserve accents exactly ("respiración" NOT "respiracion")
- Length: 1-4 words maximum per term

## Include (prioritize)
- Core domain concepts and technical vocabulary
- Terms students likely need clarification on
- Terms prominent in headers or central to explanations

## Exclude
- Common everyday words
- Proper nouns (names, places, brands)
- Terms already explained in detail in the text
- Duplicates or variations (pick one canonical form)

# DEFINITION RULES

- Maximum ${maxDefinitionLength} characters (STRICT)
- Clear, standalone, no circular definitions
- Language: ${language}

# QUALITY OVER QUANTITY

Only include terms that genuinely help students. If the text only has 2 valuable terms, return 2. If it has 10 valuable terms, return only the ${maxTerms} most important.`,
    },
    {
      role: 'user',
      content: `Extract key terms from this content (maximum ${maxTerms}):

${blocks.map((block, index) => `## Block ${index + 1}\n${block.markdown}`).join('\n\n')}`,
    },
  ]
}