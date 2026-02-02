import {
  AiTargetLevel,
  AiAudience,
  AiLength,
  AiTone,
  BlockType,
} from 'src/core/database/generated/enums'
import type { PromptInput } from '../interfaces/prompt-input.interface'
import {
  AiCodeBlock,
  AiContent,
  AiImageSuggestionBlock,
  AiTextBlock,
} from '../interfaces/ai-generated-content.interface'
import {
  getAudienceGuidance,
  getTargetLevelGuidance,
  getToneGuidance,
} from '../helpers/guidances'

export interface RegeneratePageContentPromptInput {
  title: string
  instructions: string
  blocks: Array<{
    type: BlockType
    content: AiContent
  }>
  config: {
    language: string
    targetLevel: AiTargetLevel
    audience: AiAudience
    contentLength: AiLength
    tone: AiTone
    learningObjectives?: string[]
  }
}

export const regeneratePageContentPrompt = (
  input: RegeneratePageContentPromptInput,
): PromptInput[] => {
  const { title, instructions, blocks, config } = input

  const systemPrompt = buildRegenerationSystemPrompt(config)
  const userPrompt = buildRegenerationUserPrompt(title, blocks, instructions)

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ]
}

function buildRegenerationSystemPrompt(
  config: RegeneratePageContentPromptInput['config'],
): string {
  const audienceDesc = getAudienceGuidance(config.audience)
  const levelDesc = getTargetLevelGuidance(config.targetLevel)
  const toneDesc = getToneGuidance(config.tone)

  return `You are an expert educational content editor. Modify existing lesson content based on teacher instructions.

# Output Format

Respond ONLY with valid JSON. No markdown fences, no text before or after.

{
  "title": "Updated or original title",
  "keywords": ["keyword1", "keyword2", ...],
  "blocks": [
    {
      "type": "TEXT",
      "content": { "markdown": "## Heading\\n\\nParagraph..." }
    },
    {
      "type": "CODE",
      "content": { "language": "python", "code": "def example():\\n    pass" }
    },
    {
      "type": "IMAGE_SUGGESTION",
      "content": { "prompt": "DALL-E prompt in English", "reason": "Why this image helps" }
    }
  ]
}

# Editing Rules

1. Analyze the teacher's instructions and determine which blocks need modification.

2. You MAY:
   - Modify content of any block
   - Add new blocks where appropriate
   - Remove blocks if instructed or if they become redundant
   - Reorder blocks for better flow
   - Split one TEXT block into multiple (with other block types between them)
   - Merge multiple TEXT blocks into one

3. You must NOT:
   - Create consecutive TEXT blocks (always consolidate or separate with CODE/IMAGE_SUGGESTION)
   - Ignore the teacher's instructions
   - Drastically change content that wasn't mentioned in the instructions

4. Preserve content that is NOT related to the edit instructions unless changes are necessary for coherence.

# Block Types

TEXT:
- Use markdown: ##/### headings, **bold**, *italic*, - lists, > blockquotes
- Consolidate continuous text into single blocks

CODE:
- Include language and properly escaped code
- Add helpful comments

IMAGE_SUGGESTION:
- "prompt": detailed DALL-E prompt in English
- "reason": explanation in ${config.language} of why this image helps

# Content Settings

- Language: ${config.language}
- Audience: ${audienceDesc}
- Level: ${levelDesc}
- Tone: ${toneDesc}
${config.learningObjectives?.length ? `- Objectives: ${config.learningObjectives.join('; ')}` : ''}`
}

function buildRegenerationUserPrompt(
  title: string,
  blocks: RegeneratePageContentPromptInput['blocks'],
  instruction: string,
): string {
  const blocksRepresentation = formatBlocksForPrompt(blocks)

  return `# Current Content

Title: ${title}

${blocksRepresentation}

# Edit Instructions

${instruction}`
}

function formatBlocksForPrompt(
  blocks: RegeneratePageContentPromptInput['blocks'],
): string {
  return blocks
    .map((block, index) => {
      const blockNumber = index + 1

      switch (block.type) {
        case BlockType.TEXT:
          const textContent = block.content as AiTextBlock
          return `## Block ${blockNumber}: TEXT

${textContent.markdown}`

        case BlockType.CODE:
          const codeContent = block.content as AiCodeBlock
          return `## Block ${blockNumber}: CODE

\`\`\`${codeContent.language}
${codeContent.code}
\`\`\``

        case BlockType.IMAGE_SUGGESTION:
          const suggestionContent = block.content as AiImageSuggestionBlock
          return `## Block ${blockNumber}: IMAGE_SUGGESTION

Prompt: ${suggestionContent.prompt}
Reason: ${suggestionContent.reason}`

        default:
          return ''
      }
    })
    .filter(Boolean)
    .join('\n\n---\n\n')
}
