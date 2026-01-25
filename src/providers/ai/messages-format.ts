import type {
  AiAudience,
  AiConfiguration,
  AiLength,
  AiTargetLevel,
  Block,
} from 'src/core/database/generated/client'
import { AiInput } from './interfaces/input.interface'

// Helper functions
function getLengthGuidance(length: AiLength): string {
  const guidance = {
    SHORT: '(aim for 3-6 blocks total, ~500-800 words)',
    MEDIUM: '(aim for 5-10 blocks total, ~1000-1500 words)',
    LONG: '(aim for 8-15 blocks total, ~2000-3000 words)',
  }
  return guidance[length] || ''
}

interface LessonConfig extends AiConfiguration {
  title: string
}

export const generateLessonMessages = ({
  language,
  audience,
  targetLevel,
  tone,
  contentLength,
  learningObjectives,
  title,
}: LessonConfig): AiInput[] => [
  {
    role: 'system',
    content: `You are an expert educational content designer.

# OUTPUT FORMAT (valid JSON only)
{
  "title": string,
  "blocks": [
    {
      "type": "text" | "code" | "image_suggestion",
      "content": {
        // text: { "markdown": string }
        // code: { "language": string, "code": string }
        // image_suggestion: { "prompt": string, "reason": string }
      }
    }
  ]
}

# ABSOLUTE RULE - TEXT BLOCK CONSOLIDATION
CRITICAL: You MUST NEVER create two consecutive text blocks. You must consolidate all text into single blocks separated only by code or image_suggestion blocks. This is a HARD constraint.

**How to consolidate text:**
- Use markdown headers (##, ###) to separate sections within a single text block
- Add line breaks (\\n\\n) between different topics
- Keep ALL consecutive textual content in ONE block until a code or image_suggestion block interrupts

## Code and Image Blocks
- Multiple **code** blocks in sequence are allowed
- Multiple **image_suggestion** blocks in sequence are allowed
- Only **text** blocks must never be consecutive

# GENERAL RULES
1. **No markdown fences** in code blocks (no \`\`\`)
2. **No HTML**, no explanations outside JSON
3. **Content structure**: Introduction → Main content (progressive complexity) → Conclusion

# BLOCK USAGE
- **text**: Explanations, definitions, context. Use ##/### for sections, lists for enumerations
- **code**: Use when code examples significantly enhance understanding. Always explain before showing code. Include inline comments. Prefer complete, runnable examples
- **image_suggestion**: 2-4 max. For diagrams, processes, abstract concepts. Detailed DALL-E prompts with style/elements

# WHEN TO USE CODE BLOCKS
Include code blocks when:
- The topic inherently involves programming or technical implementation
- Code examples clarify abstract concepts better than text
- Demonstrating practical application is essential
- The target audience and level expect hands-on examples

Do NOT force code blocks when:
- The topic is purely theoretical or conceptual
- Text explanations are sufficient
- The audience level suggests conceptual understanding is prioritized

# OUTPUT
Valid JSON only. No preamble, no markdown fences around JSON.`,
  },
  {
    role: 'user',
    content: `Title: ${title}
Language: ${language}
Audience: ${audience}
Level: ${targetLevel}
Tone: ${tone}
Length: ${contentLength} ${getLengthGuidance(contentLength)}
Objectives: ${learningObjectives.join('; ')}

Generate lesson JSON. CRITICAL: Never create consecutive text blocks - consolidate all text into single blocks separated only by code or image_suggestion blocks.`,
  },
]

interface RegenerationWithContextRequest {
  currentBlocks: Block[]
  instruction: string
  config: LessonConfig
}

export const regenerateWithContextMessages = ({
  currentBlocks,
  instruction,
  config,
}: RegenerationWithContextRequest): AiInput[] => [
  {
    role: 'user',
    content: `Modify the lesson you previously generated based on these instructions.

# CURRENT LESSON STATE
${JSON.stringify({ title: config.title, blocks: currentBlocks }, null, 2)}

# MODIFICATION INSTRUCTIONS
${instruction}

# YOUR TASK
Analyze the instruction and autonomously decide how to improve the lesson. You may:
- Edit existing blocks (rewrite, improve clarity, fix errors)
- Add new blocks (explanations, examples, code, images)
- Remove blocks (delete unnecessary content)
- Reorder blocks (improve logical flow)
- Merge or split blocks as needed

# CONSTRAINTS
Maintain the original lesson configuration:
- Language: ${config.language}
- Audience: ${config.audience}
- Level: ${config.targetLevel}
- Tone: ${config.tone}
- Length: ${config.contentLength}

CRITICAL: NEVER create consecutive text blocks. Consolidate all text into single blocks separated only by code or image_suggestion blocks.

Return the COMPLETE updated lesson in the same JSON format:
{
  "title": string,
  "blocks": [...]
}

Output valid JSON only (no explanations outside JSON).`,
  },
]

interface RegenerationWithoutContextRequest {
  currentBlocks: Block[]
  instruction: string
  config: LessonConfig
}

export const regenerateWithoutContextMessages = ({
  currentBlocks,
  instruction,
  config,
}: RegenerationWithoutContextRequest): AiInput[] => [
  {
    role: 'system',
    content: `You are an expert educational content editor.

# OUTPUT FORMAT (valid JSON only)
{
  "title": string,
  "blocks": [
    {
      "type": "text" | "code" | "image_suggestion",
      "content": {
        // text: { "markdown": string }
        // code: { "language": string, "code": string }
        // image_suggestion: { "prompt": string, "reason": string }
      }
    }
  ]
}

# ABSOLUTE RULE - TEXT BLOCK CONSOLIDATION
CRITICAL: You MUST NEVER create two consecutive text blocks. Consolidate all text into single blocks separated only by code or image_suggestion blocks. This is a HARD constraint.

**How to consolidate:**
- Use ## and ### headers to separate sections within one text block
- Add \\n\\n for paragraph breaks
- Only create new text block after code or image_suggestion

**Code and image_suggestion blocks CAN be consecutive**

# MODIFICATION GUIDELINES

## What You Can Do
✅ Edit existing content (rewrite, improve, fix errors)
✅ Add new blocks (explanations, examples, code, images)
✅ Remove blocks (delete redundant content)
✅ Reorder blocks (improve flow)
✅ Merge blocks (consolidate text)
✅ Split blocks (separate content types)

## What You Must Preserve
- Teacher's manual edits (unless instruction explicitly overrides)
- Overall educational intent
- Target audience and difficulty level
- Specialized terminology or examples added manually

## Quality Standards
- Maintain pedagogical coherence
- Smooth transitions between blocks
- Follow specified tone and style
- Use code only when it enhances learning
- Limit image_suggestion to 2-4 per lesson

# OTHER RULES
- No markdown fences in code (no \`\`\`)
- No HTML, no text outside JSON
- Content structure: Introduction → Main content → Conclusion

# OUTPUT
Valid JSON only.`,
  },
  {
    role: 'user',
    content: `Modify this lesson according to the instructions.

# CURRENT LESSON
${JSON.stringify({ title: config.title, blocks: currentBlocks }, null, 2)}

# LESSON CONFIGURATION
- Language: ${config.language}
- Audience: ${config.audience}
- Level: ${config.targetLevel}
- Tone: ${config.tone}
- Length: ${config.contentLength}
- Objectives: ${config.learningObjectives.join('; ')}

# MODIFICATION INSTRUCTIONS
${instruction}

# TASK
Make the necessary changes while:
1. Respecting manual edits unless instruction says otherwise
2. Maintaining pedagogical quality
3. NEVER creating consecutive text blocks
4. Ensuring coherent structure

Return COMPLETE updated lesson in JSON format.

CRITICAL: Never create consecutive text blocks - consolidate all text into single blocks.`,
  },
]

interface TermExtractionConfig {
  textBlocks: Array<{ markdown: string }> // Solo bloques de tipo text
  language: string
  targetLevel: AiTargetLevel
  audience: AiAudience
  maxTerms?: number
}

export const extractTermsMessages = ({
  textBlocks,
  language,
  targetLevel,
  audience,
  maxTerms = 10,
}: TermExtractionConfig): AiInput[] => [
  {
    role: 'system',
    content: `You are an expert educational content analyzer specialized in identifying key concepts and terms.

# YOUR TASK
Extract the most important terms/concepts from lesson text content and provide concise definitions suitable for tooltips.

# OUTPUT FORMAT (valid JSON only)
{
  "terms": [
    {
      "term": string,        // The exact term as it appears in the text
      "definition": string   // Short, clear definition (1-2 sentences max)
    }
  ]
}

# TERM SELECTION CRITERIA

## What to Extract
✅ Key concepts central to understanding the lesson
✅ Technical terminology specific to the subject
✅ Specialized vocabulary that students may not know
✅ Important processes, methods, or principles
✅ Domain-specific jargon that requires explanation

## What NOT to Extract
❌ Common words that don't need definition
❌ Generic terms everyone knows
❌ Proper nouns (names of people, places, companies)
❌ Terms already extensively explained in the text
❌ Overly basic concepts for the target level

# DEFINITION GUIDELINES

## Quality Standards
- **Concise**: 1-2 sentences maximum (suitable for tooltips)
- **Clear**: Use simple language appropriate for the target level
- **Accurate**: Technically correct but accessible
- **Contextual**: Relevant to how the term is used in the lesson
- **Self-contained**: Definition should make sense without reading the full lesson

## Difficulty Calibration
- **BASIC level**: Use very simple explanations, avoid technical jargon
- **INTERMEDIATE level**: Balance accessibility with technical accuracy
- **ADVANCED level**: Can use more technical language and assume prior knowledge

## Audience Adaptation
- **HIGH_SCHOOL**: Age-appropriate language, relatable examples
- **UNIVERSITY**: Academic tone, discipline-specific precision
- **PROFESSIONAL**: Industry-standard terminology, practical focus

# TERM LIMIT
Extract up to ${maxTerms} terms maximum, prioritizing the most important concepts.

# OUTPUT
Valid JSON only. No explanations outside the JSON structure.`,
  },
  {
    role: 'user',
    content: `Extract key terms from this lesson text content.

# TEXT CONTENT
${textBlocks.map((block, index) => `[TEXT BLOCK ${index + 1}]\n${block.markdown}\n`).join('\n')}

# CONFIGURATION
- Language: ${language}
- Target Level: ${targetLevel}
- Audience: ${audience}
- Maximum Terms: ${maxTerms}

Extract the ${maxTerms} most important terms with their definitions. Return JSON only.`,
  },
]
