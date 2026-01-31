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
    learningObjectives?: string[]
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

  return `You are an expert educational content creator. Your task is to generate structured lesson content.

# Output Format

Respond ONLY with a valid JSON object. No markdown fences, no explanations before or after.

{
  "title": "Lesson title",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "blocks": [
    {
      "type": "TEXT" | "CODE" | "IMAGE_SUGGESTION",
      "content": {
        // TEXT: { "markdown": string }
        // CODE: { "language": string, "code": string }
        // IMAGE_SUGGESTION: { "prompt": string, "reason": string }
      }
    }
  ]
}

# Block Rules

1. TEXT blocks:
   - Use markdown: ## and ### for headings, **bold**, *italic*, lists (- or 1.), blockquotes (>)
   - NEVER create consecutive TEXT blocks. Merge all continuous text into one block.
   - A TEXT block can contain multiple headings, paragraphs, and lists.

2. CODE blocks:
   - Include ONLY when code genuinely aids understanding
   - Choose the most appropriate language for the topic
   - Include helpful comments

3. IMAGE_SUGGESTION blocks:
   - Include ONLY when a visual significantly enhances comprehension
   - "prompt": detailed DALL-E prompt in English, specify style (diagram, illustration, etc.)
   - "description": brief description in ${config.language} for the teacher

# Content Configuration

- Language: ${config.language}
- Target audience: ${audienceDesc}
- Knowledge level: ${levelDesc}
- Tone: ${toneDesc}
${config.learningObjectives?.length ? `- Learning objectives:\n${config.learningObjectives.map((obj) => `  - ${obj}`).join('\n')}` : ''}

# Quality Guidelines

- Start with a clear introduction that establishes context
- Use concrete examples to illustrate abstract concepts
- Progress logically from simple to complex
- End with a conclusion or summary that reinforces key points
- Keywords should be 5-10 specific terms that represent the core concepts`
}

function buildUserPrompt(
  title: string,
  instructions: string | undefined,
  contentLength: AiLength,
): string {
  let prompt = `Generate a lesson about: ${title}

Length: ${getLengthGuidance(contentLength)}`

  if (instructions) {
    prompt += `

Additional instructions from the teacher:
${instructions}`
  }

  return prompt
}
