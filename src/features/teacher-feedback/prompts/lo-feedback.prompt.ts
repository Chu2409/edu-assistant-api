import type { PromptInput } from 'src/providers/ai/interfaces/prompt-input.interface'
import type { LoInteractionData } from '../interfaces/feedback-data.interface'

export interface LoFeedbackPromptInput {
  language: string
  data: LoInteractionData
}

export const loFeedbackPrompt = (
  input: LoFeedbackPromptInput,
): PromptInput[] => {
  const { language, data } = input

  const system = `You are an expert educational consultant and learning analytics specialist. Your task is to analyze student interaction data for a specific learning object (lesson) and generate actionable pedagogical feedback for the teacher.

Reply ONLY with a valid JSON object in the following language: ${language}.

# OUTPUT FORMAT (strict JSON)
{
  "summary": "A concise executive summary of the overall findings (2-3 sentences)",
  "strengths": [
    { "topic": "topic name", "detail": "explanation", "priority": "HIGH|MEDIUM|LOW" }
  ],
  "improvements": [
    { "topic": "topic name", "detail": "explanation with specific suggestion", "priority": "HIGH|MEDIUM|LOW" }
  ],
  "recommendations": [
    { "topic": "action title", "detail": "concrete actionable recommendation", "priority": "HIGH|MEDIUM|LOW" }
  ]
}

# RULES
- Focus on patterns, NOT individual students (data is anonymous).
- Identify topics that students struggle with based on chat questions, forum questions, and low activity scores.
- Identify what works well based on high activity scores and positive student feedback.
- Provide concrete, actionable recommendations the teacher can implement.
- Each array should have between 1 and 5 items, prioritized by importance.
- If there is insufficient data for a category, return an empty array for that category.
- Do NOT invent data. Only analyze what is provided.`

  const chatSection =
    data.chatMessages.length > 0
      ? `## Chat Messages (anonymous, ${data.totalChatSessions} sessions)\n${data.chatMessages.map((m) => `- [${m.role}]: ${m.content}`).join('\n')}`
      : '## Chat Messages\nNo chat data available.'

  const activitySection =
    data.activityResults.length > 0
      ? `## Activity Results\n${data.activityResults.map((a) => `- Question: "${a.question}" | Attempts: ${a.totalAttempts} | Correct Rate: ${(a.correctRate * 100).toFixed(1)}%`).join('\n')}`
      : '## Activity Results\nNo activity data available.'

  const feedbackSection =
    data.studentFeedbacks.length > 0
      ? `## Student Feedbacks\n${data.studentFeedbacks.map((f) => `- "${f}"`).join('\n')}`
      : '## Student Feedbacks\nNo feedback data available.'

  const questionSection =
    data.forumQuestions.length > 0
      ? `## Forum Questions (ordered by upvotes)\n${data.forumQuestions.map((q) => `- "${q.question}" (upvotes: ${q.upvotes}, replies: ${q.repliesCount})`).join('\n')}`
      : '## Forum Questions\nNo forum questions available.'

  const notesSection =
    data.studentNotes.length > 0
      ? `## Student Notes\n${data.studentNotes.map((n) => `- "${n}"`).join('\n')}`
      : '## Student Notes\nNo notes available.'

  const user = `# Learning Object: "${data.loTitle}"
# Students who interacted: ${data.totalStudentsInteracted}
# Total interactions: ${data.totalInteractions}

## Lesson Content
${data.loContent || '(No content available)'}

${chatSection}

${activitySection}

${feedbackSection}

${questionSection}

${notesSection}`

  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ]
}
