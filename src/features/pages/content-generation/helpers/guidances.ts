import {
  AiAudience,
  AiLength,
  AiTargetLevel,
  AiTone,
} from 'src/core/database/generated/enums'

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

export const BLOCK_OUTPUT_FORMAT = `{
  "type": "TEXT",
  "content": { "markdown": "## Heading\\n\\nParagraph..." }
},
{
  "type": "CODE",
  "content": { "language": "python", "code": "def example():\\n    pass" }
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
- Consolidate continuous text. NEVER create consecutive TEXT blocks.
- Preserve all [[concept:ID|text]] and [[page:ID|text]] markers

CODE:
- Include only when code genuinely aids understanding
- Choose appropriate language, include comments
- Escape special characters properly in JSON

IMAGE_SUGGESTION:
- Include only when visuals significantly enhance comprehension
- "prompt": detailed DALL-E prompt in English
- "reason": brief reason explaining why this image helps`
