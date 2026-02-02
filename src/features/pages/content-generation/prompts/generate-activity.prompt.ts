import { PromptInput } from '../interfaces/prompt-input.interface'
import { AiTextBlock, AiCodeBlock } from '../interfaces/ai-generated-content.interface'
import { ActivityType, BlockType } from 'src/core/database/generated/enums'

export interface GenerateActivityPromptInput {
  type: ActivityType
  blocks: Array<{
    type: BlockType
    content: AiTextBlock | AiCodeBlock
  }>
  config: {
    language: string
    difficulty?: 1 | 2 | 3 | 4 | 5
  }
  instructions?: string
}

export const generateActivityPrompt = ({
  type,
  blocks,
  config,
  instructions,
}: GenerateActivityPromptInput): PromptInput[] => {
  const { language = 'es', difficulty = 3 } = config

  return [
    {
      role: 'system',
      content: buildActivitySystemPrompt(type, language, difficulty),
    },
    {
      role: 'user',
      content: buildActivityUserPrompt(type, blocks, instructions),
    },
  ]
}

function buildActivitySystemPrompt(
  type: ActivityType,
  language: string,
  difficulty: number,
): string {
  return `You are an expert educational assessment creator.

# OUTPUT FORMAT

Return ONLY raw JSON (no markdown fences, no explanation):

${getActivityStructure(type)}

# ACTIVITY TYPE: ${type}

${getActivityTypeRules(type)}

# CONSTRAINTS

- Difficulty: ${difficulty}/5 (1=basic recall, 5=advanced analysis)
- Language: ${language}
- Content must be derived from the provided lesson material

# QUALITY GUIDELINES

- Test understanding, not just memorization
- Avoid ambiguous wording
- Ensure one unambiguously correct answer
- Explanation should help students learn from mistakes`
}

function getActivityStructure(type: ActivityType): string {
  switch (type) {
    case ActivityType.MULTIPLE_CHOICE:
      return `{
  "question": "Clear question text",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": 0,
  "explanation": "Why this answer is correct"
}`

    case ActivityType.TRUE_FALSE:
      return `{
  "statement": "Statement to evaluate",
  "correctAnswer": true,
  "explanation": "Why this is true/false"
}`

    case ActivityType.FILL_BLANK:
      return `{
  "sentence": "The ___ is responsible for producing ATP.",
  "correctAnswer": "mitochondria",
  "acceptableAnswers": ["mitochondria", "mitochondrion"],
  "explanation": "Why this answer is correct"
}`

    case ActivityType.MATCH:
      return `{
  "instructions": "Match each term with its definition",
  "pairs": [
    { "left": "Term 1", "right": "Definition 1" },
    { "left": "Term 2", "right": "Definition 2" },
    { "left": "Term 3", "right": "Definition 3" },
    { "left": "Term 4", "right": "Definition 4" }
  ]
}`
  }
}

function getActivityTypeRules(type: ActivityType): string {
  switch (type) {
    case ActivityType.MULTIPLE_CHOICE:
      return `## Rules
- Exactly 4 options
- "correctAnswer" is zero-based index (0-3)
- Distractors must be plausible but wrong
- Options similar in length and structure`

    case ActivityType.TRUE_FALSE:
      return `## Rules
- Statement must be unambiguously true or false
- Avoid double negatives
- "correctAnswer" is boolean`

    case ActivityType.FILL_BLANK:
      return `## Rules
- Use "___" to mark the blank
- Only ONE blank per sentence
- Blank should test a key concept
- "acceptableAnswers" includes valid variations (1-3 max)`

    case ActivityType.MATCH:
      return `## Rules
- Exactly 4 pairs
- Left: terms/concepts, Right: definitions/descriptions
- All from lesson content
- No ambiguous matches`
  }
}

function buildActivityUserPrompt(
  type: ActivityType,
  blocks: GenerateActivityPromptInput['blocks'],
  instructions?: string,
): string {
  const formattedBlocks = blocks
    .map((block, index) => {
      if (block.type === 'TEXT') {
        const textContent = block.content as AiTextBlock
        return `## Block ${index + 1}: TEXT\n${textContent.markdown}`
      } else {
        const codeContent = block.content as AiCodeBlock
        return `## Block ${index + 1}: CODE\n\`\`\`${codeContent.language}\n${codeContent.code}\n\`\`\``
      }
    })
    .join('\n\n')

  let prompt = `Generate one ${type} activity based on this content:

${formattedBlocks}`

  if (instructions) {
    prompt += `

# TEACHER INSTRUCTIONS
${instructions}`
  }

  return prompt
}