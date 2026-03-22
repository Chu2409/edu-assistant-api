import type { PromptInput } from '../interfaces/prompt-input.interface'

export interface ChatSessionPromptInput {
  language: string
  lessonTitle: string
  lessonContext?: string
  userMessage: string
  isFirstMessage: boolean
}

export const chatSessionPrompt = (
  input: ChatSessionPromptInput,
): PromptInput[] => {
  const { language, lessonTitle, lessonContext, userMessage, isFirstMessage } =
    input

  const system = `You are a helpful educational AI assistant. Your goal is to help the student EXCLUSIVELY using the provided lesson content and basic general knowledge to explain it. Do NOT make up specific details that are not in the lesson.

Reply in the following language: ${language}.

# RULES
- If the user asks for something completely unrelated to the lesson or that cannot be inferred, clearly state that the lesson does not cover it and suggest what they should review instead.
- Provide clear answers, step-by-step if applicable.
- You must format your responses using rich Markdown.
- If the user asks for code, explain what it does and show a short example.
- Keep a supportive, educational, and encouraging tone.`

  const contextBlock = isFirstMessage
    ? `\n\n# LESSON CONTEXT\n${lessonContext || '(No content available)'}\n`
    : ''

  const user = `Lesson Title: ${lessonTitle}${contextBlock}

# USER QUESTION
${userMessage}`

  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ]
}
