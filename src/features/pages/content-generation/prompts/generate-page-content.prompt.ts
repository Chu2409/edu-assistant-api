import {
  AiAudience,
  AiLength,
  AiTargetLevel,
  AiTone,
} from 'src/core/database/generated/client'
import { PromptInput } from 'src/features/pages/content-generation/interfaces/prompt-input.interface'
import {
  getAudienceGuidance,
  getLengthGuidance,
  getTargetLevelGuidance,
  getToneGuidance,
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
  const audienceDesc = getAudienceGuidance(config.audience)
  const levelDesc = getTargetLevelGuidance(config.targetLevel)
  const toneDesc = getToneGuidance(config.tone)

  return `You are an expert educational content creator. Generate structured lesson content.

# Output Format

Respond ONLY with valid JSON. No markdown fences, no text before or after.

{
  "title": "Lesson title",
  "keywords": ["keyword1", "keyword2", ...],
  "blocks": [
    {
      "type": "TEXT",
      "content": { "markdown": "## Heading\\n\\nParagraph with **bold**..." }
    },
    {
      "type": "CODE",
      "content": { "language": "python", "code": "def example():\\n    pass" }
    },
    {
      "type": "IMAGE_SUGGESTION",
      "content": { "prompt": "DALL-E prompt in English", "reason": "Description in ${config.language}" }
    }
  ]
}

# Block Types

TEXT:
- Use markdown: ##/### headings, **bold**, *italic*, - lists, > blockquotes
- Consolidate continuous text. NEVER create consecutive TEXT blocks.
- One TEXT block can have multiple headings, paragraphs, lists.

CODE:
- Include only when code genuinely aids understanding
- Choose appropriate language, include comments
- Escape special characters properly in JSON

IMAGE_SUGGESTION:
- Include only when visuals significantly enhance comprehension
- "prompt": detailed DALL-E prompt in English
- "reason": brief reason in ${config.language}

# Content Settings

- Language: ${config.language}
- Audience: ${audienceDesc}
- Level: ${levelDesc}
- Tone: ${toneDesc}

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
