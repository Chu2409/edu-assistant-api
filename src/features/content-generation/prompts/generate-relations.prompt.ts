import { BlockType } from 'src/core/database/generated/enums'
import {
  AiCodeBlock,
  AiContent,
  AiTextBlock,
} from '../interfaces/ai-generated-content.interface'
import { PromptInput } from '../interfaces/prompt-input.interface'

export interface GeneratePageRelationsPromptInput {
  currentPage: {
    id: number
    title: string
    blocks: Array<{
      type: BlockType
      content: AiContent
    }>
  }
  candidatePages: Array<{
    id: number
    title: string
    summary: string
    keywords: string[]
  }>
  config: {
    maxRelationsPerPage?: number
  }
}

export const generatePageRelationsPrompt = (
  input: GeneratePageRelationsPromptInput,
): PromptInput[] => {
  const { currentPage, candidatePages, config } = input
  const maxRelations = config.maxRelationsPerPage ?? 5

  return [
    {
      role: 'system',
      content: buildRelationsSystemPrompt(maxRelations),
    },
    {
      role: 'user',
      content: buildRelationsUserPrompt(currentPage, candidatePages),
    },
  ]
}

function buildRelationsSystemPrompt(maxRelations: number): string {
  return `You are an expert educational content analyst. Identify meaningful relationships between lesson pages.

# Output Format

Respond ONLY with valid JSON. No markdown fences, no text before or after.

{
  "relations": [
    {
      "targetPageId": 12,
      "mentionText": "respiración celular"
    }
  ]
}

# Rules

1. "mentionText" MUST be an EXACT phrase from the current page content (1-5 words)
2. The phrase must naturally refer to or relate to the target page's topic
3. Prefer specific terms over generic phrases
4. Each relation must add educational value
5. Maximum ${maxRelations} relations total
6. Do NOT create relations if no meaningful connection exists
7. Do NOT use the same mentionText for multiple relations

# Quality Guidelines

- Prioritize strong, clear connections over weak ones
- The mentionText should make sense as a clickable link
- Consider what would help a student navigate between related content
- Avoid obvious or superficial connections`
}

function buildRelationsUserPrompt(
  currentPage: GeneratePageRelationsPromptInput['currentPage'],
  candidatePages: GeneratePageRelationsPromptInput['candidatePages'],
): string {
  const currentContent = formatBlocksAsText(currentPage.blocks)

  const candidatesDescription = candidatePages
    .map(
      (page) =>
        `- Page ID ${page.id}: "${page.title}"
  Keywords: ${page.keywords.join(', ')}
  Summary: ${page.summary}`,
    )
    .join('\n\n')

  return `# Current Page

ID: ${currentPage.id}
Title: ${currentPage.title}

## Content

${currentContent}

# Candidate Pages for Relations

${candidatesDescription}

# Task

Analyze the current page content and identify phrases that naturally relate to any of the candidate pages. For each relation found, specify the exact text from the current page that should link to the target page.`
}

function formatBlocksAsText(
  blocks: Array<{ type: BlockType; content: AiContent }>,
): string {
  return blocks
    .map((block) => {
      switch (block.type) {
        case BlockType.TEXT: {
          const textContent = block.content as AiTextBlock
          return textContent.markdown
            .replace(/\[\[concept:\d+\|([^\]]+)\]\]/g, '$1')
            .replace(/\[\[page:\d+\|([^\]]+)\]\]/g, '$1')
        }
        case BlockType.CODE: {
          const codeContent = block.content as AiCodeBlock
          return `[Code block: ${codeContent.language}]`
        }
        default:
          return ''
      }
    })
    .filter(Boolean)
    .join('\n\n')
}
