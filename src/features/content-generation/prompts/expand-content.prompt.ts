import {
  AiAudience,
  AiTargetLevel,
  AiTone,
  BlockType,
} from 'src/core/database/generated/enums'
import { AiContent } from '../interfaces/ai-generated-content.interface'
import { PromptInput } from '../interfaces/prompt-input.interface'
import {
  BLOCK_OUTPUT_FORMAT,
  BLOCK_TYPE_RULES,
  JSON_ONLY_INSTRUCTION,
  formatBlocksForPrompt,
  getContentSettingsBlock,
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
  return `You are an expert educational content creator. Generate additional content to expand an existing lesson.

# Output Format

${JSON_ONLY_INSTRUCTION}

{
  "blocks": [
${BLOCK_OUTPUT_FORMAT}
  ]
}

${BLOCK_TYPE_RULES}

${getContentSettingsBlock(config)}

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
