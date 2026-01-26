import { AiAudience, AiTargetLevel } from 'src/core/database/generated/enums'
import { PromptInput } from '../interfaces/prompt-input.interface'
import { TextBlock } from '../interfaces/content-block.interface'

export interface ExtractPageConceptsPrompt {
  textBlocks: TextBlock[] // Solo bloques de tipo text
  language: string
  targetLevel: AiTargetLevel
  audience: AiAudience
  maxTerms?: number
}

export const extractPageConceptsPrompt = ({
  textBlocks,
  language,
  targetLevel,
  audience,
  maxTerms = 10,
}: ExtractPageConceptsPrompt): PromptInput[] => [
  {
    role: 'system',
    content: `You are an expert educational content analyzer specialized in identifying key concepts and terms.

# OUTPUT FORMAT
CRITICAL: Return ONLY raw JSON. Do NOT wrap in markdown code fences. Do NOT add \`\`\`json or \`\`\`. Just the JSON object.

Expected format:
{
  "terms": [
    {
      "term": string,
      "definition": string
    }
  ]
}

# CRITICAL TERM EXTRACTION RULE
🚨 IMPORTANT: Extract terms EXACTLY as they appear in the text content.

**Requirements:**
- The "term" field MUST contain the EXACT word or phrase from the text
- Use the exact spelling, including hyphens, capitalization variations are acceptable
- Can be single words ("variable", "function") or compound phrases ("machine learning", "data structure")
- The term must be searchable in the original text (case-insensitive matching)

# TERM SELECTION CRITERIA

## What to Extract
✅ Key concepts central to understanding the lesson
✅ Technical terminology specific to the subject
✅ Specialized vocabulary that students may not know
✅ Important processes, methods, or principles
✅ Domain-specific jargon that requires explanation
✅ Terms that appear verbatim in the text (single or multi-word)

## What NOT to Extract
❌ Paraphrased or summarized concepts not in the text
❌ Common words that don't need definition
❌ Generic terms everyone knows
❌ Proper nouns (names of people, places, companies)
❌ Terms already extensively explained in the text
❌ Overly basic concepts for the target level
❌ Made-up phrases that don't appear in the original text

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
Extract up to ${maxTerms} terms maximum, prioritizing the most important concepts that appear verbatim in the text.`,
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

CRITICAL: Extract ONLY terms that appear EXACTLY in the text above (case-insensitive). Return ${maxTerms} terms maximum. Return ONLY the JSON object. No markdown fences, no explanations.`,
  },
]
