import {
  AiTargetLevel,
  AiAudience,
  AiLength,
  AiTone,
  BlockType,
} from 'src/core/database/generated/enums'
import type { PromptInput } from '../../../../providers/ai/interfaces/prompt-input.interface'
import { AiContent } from '../../shared/interfaces/ai-generated-content.interface'
import {
  BLOCK_OUTPUT_FORMAT,
  BLOCK_TYPE_RULES,
  JSON_ONLY_INSTRUCTION,
  SPECIAL_MARKERS_RULES,
  formatBlocksForPrompt,
  getContentSettingsBlock,
} from '../../shared/helpers/guidances'

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
  return `You are an expert educational content editor. Modify existing lesson content based on teacher instructions.

# Output Format

${JSON_ONLY_INSTRUCTION}

{
  "title": "Updated or original title",
  "keywords": ["keyword1", "keyword2", ...],
  "blocks": [
${BLOCK_OUTPUT_FORMAT}
  ]
}

${SPECIAL_MARKERS_RULES}

# Editing Rules

1. Analyze the teacher's instructions and determine which blocks need modification.

2. You MAY:
   - Modify content of any block
   - Add new blocks where appropriate
   - Remove blocks if instructed or redundant
   - Reorder blocks for better flow
   - Split one TEXT block into multiple (with other block types between them)
   - Merge multiple TEXT blocks into one

3. You must NOT:
   - Create consecutive TEXT blocks
   - Ignore the teacher's instructions
   - Drastically change content not mentioned in instructions
   - Break or remove special markers unless content is deleted

4. Preserve content NOT related to edit instructions unless changes are necessary for coherence.

${BLOCK_TYPE_RULES}

${getContentSettingsBlock(config)}`
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
