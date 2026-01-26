import { AiAudience, AiTargetLevel } from 'src/core/database/generated/enums'
import { PromptInput } from '../interfaces/prompt-input.interface'

export interface ExtractPageTermsPrompt {
  textBlocks: Array<{ markdown: string }> // Solo bloques de tipo text
  language: string
  targetLevel: AiTargetLevel
  audience: AiAudience
  maxTerms?: number
}

export const extractPageTermsPrompt = ({
  textBlocks,
  language,
  targetLevel,
  audience,
  maxTerms = 10,
}: ExtractPageTermsPrompt): PromptInput[] => [
  {
    role: 'system',
    content: `You are an expert educational content analyzer specialized in identifying key concepts and terms.

# YOUR TASK
Extract the most important terms/concepts from lesson text content and provide concise definitions suitable for tooltips.

# OUTPUT FORMAT (valid JSON only)
{
  "terms": [
    {
      "term": string,        // The exact term as it appears in the text
      "definition": string   // Short, clear definition (1-2 sentences max)
    }
  ]
}

# TERM SELECTION CRITERIA

## What to Extract
✅ Key concepts central to understanding the lesson
✅ Technical terminology specific to the subject
✅ Specialized vocabulary that students may not know
✅ Important processes, methods, or principles
✅ Domain-specific jargon that requires explanation

## What NOT to Extract
❌ Common words that don't need definition
❌ Generic terms everyone knows
❌ Proper nouns (names of people, places, companies)
❌ Terms already extensively explained in the text
❌ Overly basic concepts for the target level

# DEFINITION GUIDELINES

## Quality Standards
- **Concise**: 1-2 sentences maximum (suitable for tooltips)
- **Clear**: Use simple language appropriate for the target level
- **Accurate**: Technically correct but accessible
- **Contextual**: Relevant to how the term is used in the lesson
- **Self-contained**: Definition should make sense without reading the full lesson

## Difficulty Calibration
- **BASIC level**: Use very simple explanations, avoid technical jargon
- **INTERMEDIATE level**: Balance accessibility with technical accuracy
- **ADVANCED level**: Can use more technical language and assume prior knowledge

## Audience Adaptation
- **HIGH_SCHOOL**: Age-appropriate language, relatable examples
- **UNIVERSITY**: Academic tone, discipline-specific precision
- **PROFESSIONAL**: Industry-standard terminology, practical focus

# TERM LIMIT
Extract up to ${maxTerms} terms maximum, prioritizing the most important concepts.

# OUTPUT
Valid JSON only. No explanations outside the JSON structure.`,
  },
  {
    role: 'user',
    content: `Extract key terms from this lesson text content.

# TEXT CONTENT
${textBlocks.map((block, index) => `[TEXT BLOCK ${index + 1}]\n${block.markdown}\n`).join('\n')}

# CONFIGURATION
- Language: ${language}
- Target Level: ${targetLevel}
- Audience: ${audience}
- Maximum Terms: ${maxTerms}

Extract the ${maxTerms} most important terms with their definitions. Return JSON only.`,
  },
]
