import {
  AiAudience,
  AiLength,
  AiTargetLevel,
  AiTone,
} from 'src/core/database/generated/client'
import { PromptInput } from 'src/features/pages/content-generation/interfaces/prompt-input.interface'
import { getLengthGuidance } from '../helpers/guidances'

export interface GeneratePageContentPrompt {
  title: string
  language: string
  contextPrompt?: string
  targetLevel: AiTargetLevel
  audience: AiAudience
  learningObjectives: string[]
  contentLength: AiLength
  tone: AiTone
}

export const generatePageContentPrompt = ({
  language,
  audience,
  targetLevel,
  tone,
  contentLength,
  learningObjectives,
  title,
}: GeneratePageContentPrompt): PromptInput[] => [
  {
    role: 'system',
    content: `You are an expert educational content designer.

# OUTPUT FORMAT (valid JSON only)
{
  "title": string,
  "blocks": [
    {
      "type": "TEXT" | "CODE" | "IMAGE_SUGGESTION",
      "content": {
        // TEXT: { "markdown": string }
        // CODE: { "language": string, "code": string }
        // IMAGE_SUGGESTION: { "prompt": string, "reason": string }
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
