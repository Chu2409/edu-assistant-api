import { AiAudience, AiTargetLevel } from 'src/core/database/generated/enums'
import { PromptInput } from '../interfaces/prompt-input.interface'
import { AiTextBlock } from '../interfaces/ai-generated-content.interface'

export interface ExtractPageConceptsPrompt {
  textBlocks: AiTextBlock[]
  language: string
  targetLevel: AiTargetLevel
  audience: AiAudience
  moduleContext?: string
  maxTerms?: number
  maxDefinitionLength?: number
}

export const extractPageConceptsPrompt = ({
  textBlocks,
  language,
  targetLevel,
  audience,
  moduleContext,
  maxTerms = 10,
  maxDefinitionLength = 120,
}: ExtractPageConceptsPrompt): PromptInput[] => [
  {
    role: 'system',
    content: `You are an expert educational content analyzer.

# OUTPUT FORMAT
Return ONLY raw JSON (no \`\`\`json fences):
{
  "terms": [
    { "term": string, "definition": string }
  ]
}

# TERM EXTRACTION RULES

## Exact Matching (CRITICAL)
- Terms MUST appear VERBATIM in the text
- Preserve exact spelling, spacing, hyphens
- Case-insensitive OK ("Variable" → "variable")
- Preserve accents exactly ("respiración" not "respiracion")
- Choose most common form for singular/plural
- Length: 1-4 words maximum

## Selection Priority
1. **Educational value**: Core concepts, technical vocabulary, foundational terms
2. **Student need**: Unfamiliar specialized terms for target level
3. **Text prominence**: Frequent terms, in headers, central to examples

## Include
- Domain-specific terminology
- Technical terms needing definition
- Important processes/methods/principles
- Abstract concepts requiring explanation

## Exclude
- Common everyday words
- Proper nouns (names, places, brands)
- Already extensively explained in text
- Too basic for target level
- Paraphrased concepts not verbatim
- Duplicates/variations (choose one canonical form)

# DEFINITIONS

**Constraints:**
- Max ${maxDefinitionLength} characters (including spaces)
- Target: 15-25 words
- Clear, precise, contextual, standalone
- No circular definitions

**Adapt to level/audience:**
- BASIC/HIGH_SCHOOL: Simple language, analogies, relatable examples
- INTERMEDIATE/UNIVERSITY: Balance accuracy with accessibility
- ADVANCED/PROFESSIONAL: Technical language, assume prior knowledge

**Examples:**
BASIC: "variable" → "Container storing program information, like a labeled box holding data."
INTERMEDIATE: "variable" → "Named memory location holding a changeable value during execution."
ADVANCED: "variable" → "Symbolic reference to a memory address with a mutable value in scope."

# LIMITS
Extract UP TO ${maxTerms} terms. Quality over quantity - fewer strong terms better than many weak ones.`,
  },
  {
    role: 'user',
    content: `Extract key terms from this lesson.

# TEXT CONTENT
${textBlocks
  .map(
    (block, index) => `## Block ${index + 1}
${block.markdown}
`,
  )
  .join('\n')}

# PARAMETERS
Language: ${language} | Level: ${targetLevel} | Audience: ${audience} | Max: ${maxTerms} terms | Def limit: ${maxDefinitionLength} chars${moduleContext ? ` | Context: ${moduleContext}` : ''}

Return ${maxTerms} most valuable terms appearing VERBATIM in text (case-insensitive, preserve accents). Definitions under ${maxDefinitionLength} chars. JSON only.`,
  },
]
