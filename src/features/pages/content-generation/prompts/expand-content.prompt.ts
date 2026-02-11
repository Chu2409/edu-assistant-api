import {
  AiAudience,
  AiTargetLevel,
  AiTone,
  BlockType,
} from 'src/core/database/generated/enums'
import {
  AiCodeBlock,
  AiContent,
  AiImageSuggestionBlock,
  AiTextBlock,
} from '../interfaces/ai-generated-content.interface'
import { PromptInput } from '../interfaces/prompt-input.interface'
import {
  BLOCK_OUTPUT_FORMAT,
  BLOCK_TYPE_RULES,
  getAudienceGuidance,
  getTargetLevelGuidance,
  getToneGuidance,
} from '../helpers/guidances'

export interface ExpandContentPromptInput {
  existingBlocks: Array<{
    type: BlockType
    content: AiContent
  }>
  instruction: string
  insertPosition: 'before' | 'after' | 'replace'
  targetBlockIndex?: number // Si es undefined, se agrega al final
  config: {
    language: string
    targetLevel: AiTargetLevel
    audience: AiAudience
    tone: AiTone
  }
}

export const expandContentPrompt = (
  input: ExpandContentPromptInput,
): PromptInput[] => {
  const {
    existingBlocks,
    instruction,
    insertPosition,
    targetBlockIndex,
    config,
  } = input

  return [
    { role: 'system', content: buildExpandSystemPrompt(config) },
    {
      role: 'user',
      content: buildExpandUserPrompt(
        existingBlocks,
        instruction,
        insertPosition,
        targetBlockIndex,
      ),
    },
  ]
}

function buildExpandSystemPrompt(
  config: ExpandContentPromptInput['config'],
): string {
  const audienceDesc = getAudienceGuidance(config.audience)
  const levelDesc = getTargetLevelGuidance(config.targetLevel)
  const toneDesc = getToneGuidance(config.tone)

  return `You are an expert educational content creator. Generate additional content to expand an existing lesson.

# Output Format

Respond ONLY with valid JSON. No markdown fences, no text before or after.

{
  "blocks": [
${BLOCK_OUTPUT_FORMAT}
  ]
}

${BLOCK_TYPE_RULES}

# Content Settings

- Language: ${config.language}
- Audience: ${audienceDesc}
- Level: ${levelDesc}
- Tone: ${toneDesc}

# Guidelines

- Generate content that flows naturally with existing material
- Maintain consistent style and depth
- Do NOT repeat information already covered
- Focus only on what the teacher requested`
}

function buildExpandUserPrompt(
  existingBlocks: ExpandContentPromptInput['existingBlocks'],
  instruction: string,
  insertPosition: 'before' | 'after' | 'replace',
  targetBlockIndex?: number,
): string {
  const blocksRepresentation = formatBlocksForPrompt(existingBlocks)

  let positionContext = ''
  if (targetBlockIndex !== undefined) {
    const positionDesc = {
      before: `BEFORE block ${targetBlockIndex + 1}`,
      after: `AFTER block ${targetBlockIndex + 1}`,
      replace: `REPLACING block ${targetBlockIndex + 1}`,
    }
    positionContext = `\nPosition: Insert new content ${positionDesc[insertPosition]}`
  } else {
    positionContext = '\nPosition: Append to end of lesson'
  }

  return `# Existing Content (for context)

${blocksRepresentation}

# Instructions

${instruction}
${positionContext}

Generate new blocks that integrate smoothly with the existing content.`
}

function formatBlocksForPrompt(
  blocks: Array<{ type: BlockType; content: AiContent }>,
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
