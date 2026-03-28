import { BlockType } from 'src/core/database/generated/enums'
import {
  AiCodeBlock,
  AiContent,
  AiImageSuggestionBlock,
  AiTextBlock,
} from '../../shared/interfaces/ai-generated-content.interface'
import { PromptInput } from '../../../../providers/ai/interfaces/prompt-input.interface'
import {
  AiTone,
  AiAudience,
  AiTargetLevel,
} from 'src/core/database/generated/enums'
import {
  BLOCK_TYPE_RULES,
  JSON_ONLY_INSTRUCTION,
  SPECIAL_MARKERS_RULES,
  getBlockOutputFormatByType,
  getContentSettingsBlock,
} from '../../shared/helpers/guidances'

export interface RegenerateBlockPromptInput {
  blockIndex: number
  block: {
    type: BlockType
    content: AiContent
  }
  instruction: string
  context: {
    pageTitle: string
    previousBlock?: {
      type: BlockType
      content: AiContent
    }
    nextBlock?: {
      type: BlockType
      content: AiContent
    }
  }
  config: {
    language: string
    targetLevel: AiTargetLevel
    audience: AiAudience
    tone: AiTone
  }
}

export const regenerateBlockPrompt = (
  input: RegenerateBlockPromptInput,
): PromptInput[] => {
  const { block, instruction, context, config } = input

  return [
    {
      role: 'system',
      content: buildBlockRegenerationSystemPrompt(block.type, config),
    },
    {
      role: 'user',
      content: buildBlockRegenerationUserPrompt(block, instruction, context),
    },
  ]
}

function buildBlockRegenerationSystemPrompt(
  blockType: BlockType,
  config: RegenerateBlockPromptInput['config'],
): string {
  return `You are an expert educational content editor. Modify a single content block based on teacher instructions.

# Output Format

${JSON_ONLY_INSTRUCTION}

${getBlockOutputFormatByType(blockType)}

${SPECIAL_MARKERS_RULES}

${BLOCK_TYPE_RULES}

${getContentSettingsBlock(config)}

# Guidelines

- Maintain coherence with surrounding content
- Apply only the requested changes
- Preserve the block type unless explicitly instructed to change it`
}

function buildBlockRegenerationUserPrompt(
  block: RegenerateBlockPromptInput['block'],
  instruction: string,
  context: RegenerateBlockPromptInput['context'],
): string {
  let prompt = `# Page Context

Title: ${context.pageTitle}

`

  if (context.previousBlock) {
    prompt += `# Previous Block (for context only, do not modify)

${formatSingleBlock(context.previousBlock)}

`
  }

  prompt += `# Block to Modify

${formatSingleBlock(block)}

`

  if (context.nextBlock) {
    prompt += `# Next Block (for context only, do not modify)

${formatSingleBlock(context.nextBlock)}

`
  }

  prompt += `# Edit Instructions

${instruction}`

  return prompt
}

function formatSingleBlock(block: {
  type: BlockType
  content: AiContent
}): string {
  switch (block.type) {
    case BlockType.TEXT: {
      const textContent = block.content as AiTextBlock
      return `Type: TEXT

${textContent.markdown}`
    }

    case BlockType.CODE: {
      const codeContent = block.content as AiCodeBlock
      return `Type: CODE

\`\`\`${codeContent.language}
${codeContent.code}
\`\`\``
    }

    case BlockType.IMAGE_SUGGESTION: {
      const suggestionContent = block.content as AiImageSuggestionBlock
      return `Type: IMAGE_SUGGESTION

Prompt: ${suggestionContent.prompt}
Reason: ${suggestionContent.reason}`
    }

    default:
      return ''
  }
}
