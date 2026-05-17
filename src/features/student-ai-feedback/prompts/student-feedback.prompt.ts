import type { PromptInput } from 'src/providers/ai/interfaces/prompt-input.interface'
import type { StudentInteractionData } from '../interfaces/student-feedback-data.interface'

export interface StudentFeedbackPromptInput {
  language: string
  studentName: string
  data: StudentInteractionData
}

export const studentFeedbackPrompt = (
  input: StudentFeedbackPromptInput,
): PromptInput[] => {
  const { language, studentName, data } = input

  const system = `You are an expert educational consultant for the NousAI platform. NousAI is an educational platform where students learn through Learning Objects (educational content), Activities (practical exercises with attempts and success rate), Forum Questions (student questions to the community), and Chat Sessions (conversations per Learning Object).

Your task is to analyze a student's weekly interaction data and provide personalized, actionable feedback.

Reply ONLY with a valid JSON object in the following language: ${language}.

# OUTPUT FORMAT (strict JSON)
{
  "summary": "Executive summary of the student's week (2-3 sentences). Include specific numbers when available. Be concrete and specific.",
  "strengths": [
    { "topic": "topic name", "detail": "specific explanation of what the student did well", "priority": "HIGH|MEDIUM|LOW" }
  ],
  "improvements": [
    { "topic": "topic name", "detail": "specific explanation of the difficulty with actionable suggestion", "priority": "HIGH|MEDIUM|LOW" }
  ],
  "recommendations": [
    { "topic": "action title", "detail": "concrete, actionable recommendation the student can follow", "priority": "HIGH|MEDIUM|LOW" }
  ]
}

# RULES
- Address the student by name in the summary.
- Focus on the STUDENT's specific difficulties, not aggregated class data.
- Be specific: name the exact concepts, Learning Objects, and strategies.
- Recommendations should be concrete and actionable (e.g., "Revisá la lección sobre X y enfocate en Y", not just "study more").
- Identify strengths based on high success rates, completed LOs, and good activity performance.
- Identify improvements based on low success rates, failed attempts, and questions asked in chat or forum.
- Each array should have between 1 and 5 items, prioritized by importance.
- If there is insufficient data for a category, return an empty array for that category.
- NEVER mention 'AI', 'system', or 'algorithm' in the output.
- Keep the tone supportive and constructive — this is a weekly learning companion.
- Do NOT invent data. Only analyze what is provided.`

  const activitySection =
    data.activityResults.length > 0
      ? `## Activities Completed
${data.activityResults.map((a) => `- "${a.question}" (LO: "${a.loTitle}") | Attempts: ${a.totalAttempts} | Correct: ${a.correct} | Success Rate: ${(a.correctRate * 100).toFixed(0)}%`).join('\n')}`
      : '## Activities Completed\nNo activities attempted this week.'

  const failedConceptsSection =
    data.failedConcepts.length > 0
      ? `## Concepts with Mistakes
${data.failedConcepts.map((c) => `- "${c.concept}" (LO: "${c.loTitle}", errors: ${c.errorCount})`).join('\n')}`
      : '## Concepts with Mistakes\nNo specific concepts identified.'

  const completedLosSection =
    data.completedLos.length > 0
      ? `## Learning Objects Completed Successfully
${data.completedLos.map((lo) => `- "${lo.title}"`).join('\n')}`
      : '## Learning Objects Completed Successfully\nNo LOs completed this week.'

  const chatSection =
    data.chatMessages.length > 0
      ? `## Chat Questions from this Student
${data.chatMessages.map((m) => `- [LO: "${m.loTitle}"] "${m.content}"`).join('\n')}`
      : '## Chat Questions\nNo chat questions this week.'

  const forumSection =
    data.forumQuestions.length > 0
      ? `## Forum Questions from this Student
${data.forumQuestions.map((q) => `- [LO: "${q.loTitle}"] "${q.question}"`).join('\n')}`
      : '## Forum Questions\nNo forum questions this week.'

  const user = `# Student: ${studentName}
# Module: "${data.moduleTitle}"
# Week of: ${data.weekStartDate} to ${data.weekEndDate}
# Overall Success Rate: ${(data.overallSuccessRate * 100).toFixed(1)}%
# Total Attempts: ${data.totalAttempts} | Total Correct: ${data.totalCorrect}

${completedLosSection}

${activitySection}

${failedConceptsSection}

${chatSection}

${forumSection}`

  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ]
}
