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
  contextPrompt,
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

# BLOCK STRUCTURE RULES (CRITICAL)

1. **TEXT BLOCKS MUST NEVER BE CONSECUTIVE**
   - Consolidate all sequential text into ONE block
   - Use markdown headers (##, ###, ####) to organize sections within the block
   - Use \\n\\n to separate topics and paragraphs
   - TEXT blocks can only be interrupted by CODE or IMAGE_SUGGESTION blocks
   - Example: Introduction + explanation + theory = ONE TEXT block with headers

2. **CODE and IMAGE_SUGGESTION blocks CAN be consecutive**
   - Multiple code examples in sequence: ✅ Allowed
   - Multiple image suggestions in sequence: ✅ Allowed

# MARKDOWN HIERARCHY IN TEXT BLOCKS
- ## Main sections (Introduction, Core Concepts, Conclusion)
- ### Subsections within main sections
- #### Minor subsections if needed
- Use bullet points and numbered lists for enumerations
- Use **bold** for emphasis, *italic* for terms

# BLOCK TYPES

## TEXT blocks
- Use for: Explanations, definitions, theory, context, summaries
- Structure with headers and proper markdown
- Keep related content together in one block

## CODE blocks
- **No markdown fences** (no \`\`\` in the code field)
- Always include inline comments explaining key parts
- Prefer complete, runnable examples
- Specify the programming language clearly

**When to include CODE blocks:**
- Topic involves programming or technical implementation
- Code examples clarify concepts better than text alone
- Demonstrating practical application is essential
- Target audience expects hands-on examples

**When NOT to include CODE blocks:**
- Topic is purely theoretical or conceptual
- Text explanations are sufficient
- No natural place for code in the subject matter
- If no code is needed, omit CODE blocks entirely

## IMAGE_SUGGESTION blocks
- Use 2-4 total for the entire lesson (optional, only if beneficial)
- Best for: Diagrams, processes, flowcharts, abstract concepts, visual relationships
- Provide detailed DALL-E prompts including:
  * Subject matter and key elements
  * Style (e.g., "educational illustration, flat design, minimalist")
  * Colors and composition
  * Perspective or layout
- Example prompt: "Educational diagram showing the water cycle with labeled arrows, flat design style, blue and green color palette, clear labels in Spanish"

# CONTENT STRUCTURE
1. **Introduction**: Context and overview
2. **Main Content**: Progressive complexity, building on previous concepts
3. **Conclusion**: Summary and key takeaways

# EXAMPLE OUTPUT STRUCTURE
{
  "title": "Introduction to Variables",
  "blocks": [
    {
      "type": "TEXT",
      "content": {
        "markdown": "## What are Variables?\\n\\nVariables are containers for storing data values...\\n\\n### Types of Variables\\n\\n1. **Numeric variables**: Store numbers\\n2. **Text variables**: Store strings\\n\\n## Why Variables Matter\\n\\nVariables allow programs to..."
      }
    },
    {
      "type": "CODE",
      "content": {
        "language": "python",
        "code": "# Declaring a numeric variable\\nx = 10\\n\\n# Declaring a text variable\\nname = 'Alice'"
      }
    },
    {
      "type": "IMAGE_SUGGESTION",
      "content": {
        "prompt": "Educational diagram showing variable storage in computer memory, flat design, boxes with labels, blue and purple color scheme",
        "reason": "Visual representation helps understand how variables are stored in memory"
      }
    },
    {
      "type": "TEXT",
      "content": {
        "markdown": "## Advanced Concepts\\n\\nNow that we understand basic variables..."
      }
    }
  ]
}

# OUTPUT REQUIREMENTS
- Valid JSON only
- No preamble or explanations outside the JSON
- No markdown fences around the JSON response
- No HTML tags in content`,
  },
  {
    role: 'user',
    content: `Title: ${title}
Language: ${language}
Audience: ${audience}
Level: ${targetLevel}
Tone: ${tone}
Length: ${contentLength} ${getLengthGuidance(contentLength)}
Objectives: ${learningObjectives.join('; ')}${contextPrompt ? `\nModule Context: ${contextPrompt}` : ''}

Generate the lesson content as a valid JSON object following all block structure rules. Remember: TEXT blocks must never be consecutive - consolidate all sequential text into single blocks using markdown headers.`,
  },
]
