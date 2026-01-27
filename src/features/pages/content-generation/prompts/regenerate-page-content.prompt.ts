import { Block } from 'src/core/database/generated/client'
import { GeneratePageContentPrompt } from './generate-page-content.prompt'
import { PromptInput } from '../interfaces/prompt-input.interface'

export interface RegenaretePageContentPrompt {
  currentBlocks: Block[]
  instruction: string
  config: GeneratePageContentPrompt
}

export const regeneratePageContentWithContextPrompt = ({
  currentBlocks,
  instruction,
  config,
}: RegenaretePageContentPrompt): PromptInput[] => [
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

export const regenerateWithoutContextPrompt = ({
  currentBlocks,
  instruction,
  config,
}: RegenaretePageContentPrompt): PromptInput[] => [
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
- Maintaining pedagogical quality
- NEVER creating consecutive text blocks
- Ensuring coherent structure

Return COMPLETE updated lesson in JSON format.

CRITICAL: Never create consecutive text blocks - consolidate all text into single blocks.`,
  },
]
