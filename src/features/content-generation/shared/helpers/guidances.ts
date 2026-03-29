import {
  AiAudience,
  AiLength,
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

// ========================
// Guidance value resolvers
// ========================

export const getLengthGuidance = (length: AiLength) => {
  const guidance = {
    SHORT: '(aim for 3-6 blocks total, ~500-800 words)',
    MEDIUM: '(aim for 5-10 blocks total, ~1000-1500 words)',
    LONG: '(aim for 8-15 blocks total, ~2000-3000 words)',
  }
  return guidance[length] || ''
}

export const getAudienceGuidance = (audience: AiAudience) => {
  const guidance = {
    HIGH_SCHOOL: 'high school students (15-18 years)',
    UNIVERSITY: 'university students',
    PROFESSIONAL: 'working professionals',
  }
  return guidance[audience] || ''
}

export const getTargetLevelGuidance = (targetLevel: AiTargetLevel) => {
  const guidance = {
    BASIC: 'introductory, no prior knowledge assumed',
    INTERMEDIATE: 'some familiarity with the subject expected',
    ADVANCED: 'in-depth, assumes solid foundation',
  }
  return guidance[targetLevel] || ''
}

export const getToneGuidance = (tone: AiTone) => {
  const guidance = {
    FORMAL: 'formal and academic',
    EDUCATIONAL: 'clear and educational, approachable but professional',
    CASUAL: 'conversational and friendly',
  }
  return guidance[tone] || ''
}

// ========================
// Shared prompt constants
// ========================

export const JSON_ONLY_INSTRUCTION =
  'Respond ONLY with valid JSON. No markdown fences, no text before or after.'

export const BLOCK_OUTPUT_FORMAT = `{
  "type": "TEXT",
  "content": { "markdown": "## Heading\\\\\\\\n\\\\\\\\nParagraph with **bold**..." }
},
{
  "type": "CODE",
  "content": { "language": "python", "code": "def example():\\\\\\\\n    pass" }
},
{
  "type": "IMAGE_SUGGESTION",
  "content": { "prompt": "DALL-E prompt in English", "reason": "Why this helps" }
}`

export const SPECIAL_MARKERS_RULES = `# Special Markers (CRITICAL)

The content may contain special markers that MUST be preserved:

- \`[[concept:ID|text]]\` - Term linked to a tooltip definition
- \`[[page:ID|text]]\` - Link to another lesson page

Examples:
- "La [[concept:45|mitocondria]] produce ATP"
- "Como vimos en [[page:12|respiración celular]]"

Rules for markers:
1. NEVER modify the ID numbers inside markers
2. You MAY adjust the display text if it improves clarity
3. You MAY move markers to different positions if content is reorganized
4. ONLY remove a marker if its surrounding content is explicitly deleted
5. Do NOT create new markers`

export const BLOCK_TYPE_RULES = `# Block Types

TEXT:
- Use markdown: ##/### headings, **bold**, *italic*, - lists, > blockquotes
- One TEXT block can have multiple headings, paragraphs, lists
- Consolidate continuous text. NEVER create consecutive TEXT blocks.
- Preserve all [[concept:ID|text]] and [[page:ID|text]] markers

CODE:
- Generate ONLY for programming or technical topics where code examples are essential.
- Do NOT generate for general subjects (history, literature, etc.) unless specifically requested.
- Include language identifier, add helpful comments
- Escape special characters properly in JSON
- Ensure code is syntactically correct

IMAGE_SUGGESTION:
- Include only when visuals significantly enhance comprehension
- "prompt": detailed DALL-E prompt in English, specify desired style
- "reason": brief reason explaining why this image helps (in content language)`

// ========================
// Shared prompt helpers
// ========================

export const getBlockOutputFormatByType = (blockType: BlockType): string => {
  switch (blockType) {
    case BlockType.TEXT:
      return `{
  "type": "TEXT",
  "content": { "markdown": "## Heading\\\\\\\\n\\\\\\\\nParagraph with **bold**..." }
}`

    case BlockType.CODE:
      return `{
  "type": "CODE",
  "content": { "language": "python", "code": "def example():\\\\\\\\n    pass" }
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

export const getContentSettingsBlock = (config: {
  language: string
  audience: AiAudience
  targetLevel: AiTargetLevel
  tone: AiTone
}): string => {
  return `# Content Settings

- Language: ${config.language}
- Audience: ${getAudienceGuidance(config.audience)}
- Level: ${getTargetLevelGuidance(config.targetLevel)}
- Tone: ${getToneGuidance(config.tone)}`
}

export const formatBlocksForPrompt = (
  blocks: Array<{ type: BlockType; content: AiContent }>,
): string => {
  return blocks
    .map((block, index) => {
      const blockNumber = index + 1

      switch (block.type) {
        case BlockType.TEXT: {
          const textContent = block.content as AiTextBlock
          return `## Block ${blockNumber}: TEXT\n\n${textContent.markdown}`
        }

        case BlockType.CODE: {
          const codeContent = block.content as AiCodeBlock
          return `## Block ${blockNumber}: CODE\n\n\`\`\`${codeContent.language}\n${codeContent.code}\n\`\`\``
        }

        case BlockType.IMAGE_SUGGESTION: {
          const suggestionContent = block.content as AiImageSuggestionBlock
          return `## Block ${blockNumber}: IMAGE_SUGGESTION\n\nPrompt: ${suggestionContent.prompt}\nReason: ${suggestionContent.reason}`
        }

        default:
          return ''
      }
    })
    .filter(Boolean)
    .join('\n\n---\n\n')
}
