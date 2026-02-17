import { PromptInput } from '../interfaces/prompt-input.interface'

export interface GenerateConceptDefinitionPromptInput {
  selectedText: string
  context: {
    surroundingText: string // Párrafo o sección donde aparece el término
    pageTitle: string
  }
  config: {
    language: string
    maxDefinitionLength?: number
  }
}

export const generateConceptDefinitionPrompt = ({
  selectedText,
  context,
  config,
}: GenerateConceptDefinitionPromptInput): PromptInput[] => {
  const { language = 'es', maxDefinitionLength = 120 } = config

  return [
    {
      role: 'system',
      content: `You are an expert educational content creator that generates clear, concise definitions for student tooltips.

# OUTPUT FORMAT

Return ONLY raw JSON (no markdown fences, no explanation):

{
  "terms": [
    { "term": "exact term", "definition": "brief definition" }
  ]
}

# CONSTRAINTS

1. Return EXACTLY 1 term (the selected text).
2. Definition MUST be under ${maxDefinitionLength} characters.
3. "term" must match the selected text exactly (preserve case and accents).

# DEFINITION RULES

- Maximum ${maxDefinitionLength} characters (STRICT)
- Clear, concise, educational
- Standalone (no references like "in this context" or "as mentioned")
- No circular definitions (don't use the term to define itself)
- Appropriate for students encountering this term
- Language: ${language}

# QUALITY GUIDELINES

- Define the term in a way that helps understanding within the lesson context
- Use simple language when possible
- Be precise and accurate
- If the term has multiple meanings, use the one relevant to the context provided`,
    },
    {
      role: 'user',
      content: `Generate a definition for the selected term.

# Selected Term

"${selectedText}"

# Context

Page: ${context.pageTitle}

Surrounding text:
${context.surroundingText}

Generate a clear, educational definition (max ${maxDefinitionLength} characters).`,
    },
  ]
}
