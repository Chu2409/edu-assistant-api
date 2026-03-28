import {
  AiAudience,
  AiLength,
  AiTargetLevel,
  AiTone,
} from 'src/core/database/generated/client'
import { PromptInput } from 'src/features/content-generation/interfaces/prompt-input.interface'
import {
  BLOCK_OUTPUT_FORMAT,
  BLOCK_TYPE_RULES,
  JSON_ONLY_INSTRUCTION,
  getContentSettingsBlock,
  getLengthGuidance,
} from '../helpers/guidances'

export interface GeneratePageContentPrompt {
  title: string
  instructions?: string
  config: {
    language: string
    targetLevel: AiTargetLevel
    audience: AiAudience
    contentLength: AiLength
    tone: AiTone
  }
}

export const generatePageContentPrompt = (
  input: GeneratePageContentPrompt,
): PromptInput[] => {
  const { title, instructions, config } = input

  const systemPrompt = buildSystemPrompt(config)
  const userPrompt = buildUserPrompt(title, instructions, config.contentLength)

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ]
}

function buildSystemPrompt(
  config: GeneratePageContentPrompt['config'],
): string {
  return `You are an expert educational content creator. Generate structured lesson content.

# Output Format

${JSON_ONLY_INSTRUCTION}

{
  "title": "Lesson title",
  "keywords": ["keyword1", "keyword2", ...],
  "blocks": [
${BLOCK_OUTPUT_FORMAT}
  ]
}

${BLOCK_TYPE_RULES}

${getContentSettingsBlock(config)}

# Quality

- Clear introduction establishing context
- Concrete examples for abstract concepts
- Logical progression from simple to complex
- Conclusion reinforcing key points
- 5-10 specific keywords`
}

function buildUserPrompt(
  topic: string,
  instructions: string | undefined,
  contentLength: AiLength,
): string {
  let prompt = `Topic: ${topic}
Length: ${getLengthGuidance(contentLength)}`

  if (instructions) {
    prompt += `

Teacher instructions: ${instructions}`
  }

  return prompt
}
