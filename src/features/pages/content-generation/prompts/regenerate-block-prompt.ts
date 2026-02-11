import {
  AiTone,
  AiAudience,
  AiTargetLevel,
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
  SPECIAL_MARKERS_RULES,
  getAudienceGuidance,
  getTargetLevelGuidance,
  getToneGuidance,
} from '../helpers/guidances'

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
  const audienceDesc = getAudienceGuidance(config.audience)
  const levelDesc = getTargetLevelGuidance(config.targetLevel)
  const toneDesc = getToneGuidance(config.tone)

  const outputFormat = getBlockOutputFormat(blockType)

  return `You are an expert educational content editor. Modify a single content block based on teacher instructions.

# Output Format

Respond ONLY with valid JSON. No markdown fences, no text before or after.

${outputFormat}

${SPECIAL_MARKERS_RULES}

# Block Rules

${getBlockTypeRules(blockType)}

# Content Settings

- Language: ${config.language}
- Audience: ${audienceDesc}
- Level: ${levelDesc}
- Tone: ${toneDesc}

# Guidelines

- Maintain coherence with surrounding content
- Apply only the requested changes
- Preserve the block type unless explicitly instructed to change it`
}

function getBlockOutputFormat(blockType: BlockType): string {
  switch (blockType) {
    case BlockType.TEXT:
      return `{
  "type": "TEXT",
  "content": { "markdown": "## Heading\\n\\nParagraph with **bold**..." }
}`

    case BlockType.CODE:
      return `{
  "type": "CODE",
  "content": { "language": "python", "code": "def example():\\n    pass" }
}`

    case BlockType.IMAGE_SUGGESTION:
      return `{
  "type": "IMAGE_SUGGESTION",
  "content": { "prompt": "DALL-E prompt in English", "reason": "Why this helps" }
}`

    default:
      return `{
  "type": "TEXT",
  "content": { "markdown": "..." }
}`
  }
}

function getBlockTypeRules(blockType: BlockType): string {
  switch (blockType) {
    case BlockType.TEXT:
      return `TEXT Block:
- Use markdown: ##/### headings, **bold**, *italic*, - lists, > blockquotes
- Can contain multiple paragraphs, headings, lists
- Preserve all special markers [[concept:ID|text]] and [[page:ID|text]]`

    case BlockType.CODE:
      return `CODE Block:
- Include language identifier
- Properly escape special characters in JSON
- Add helpful comments
- Ensure code is syntactically correct`

    case BlockType.IMAGE_SUGGESTION:
      return `IMAGE_SUGGESTION Block:
- "prompt": detailed DALL-E prompt in English, specify style
- "reason": brief explanation of why this image aids understanding`

    default:
      return ''
  }
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
