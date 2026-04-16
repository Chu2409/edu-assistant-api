import type { PromptInput } from 'src/providers/ai/interfaces/prompt-input.interface'
import type { ModuleInteractionData } from '../interfaces/feedback-data.interface'

export interface ModuleFeedbackPromptInput {
  language: string
  data: ModuleInteractionData
}

export const moduleFeedbackPrompt = (
  input: ModuleFeedbackPromptInput,
): PromptInput[] => {
  const { language, data } = input

  const system = `You are an expert educational consultant. Your task is to analyze the aggregated feedback from all learning objects in a module and produce a high-level pedagogical overview for the teacher.

Reply ONLY with a valid JSON object in the following language: ${language}.

# OUTPUT FORMAT (strict JSON)
{
  "summary": "An executive summary of the module's overall educational effectiveness (3-4 sentences)",
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
- Synthesize patterns across ALL learning objects. Look for recurring themes.
- Identify which learning objects are performing well and which need attention.
- Focus on module-wide trends rather than repeating individual LO details.
- Provide strategic recommendations that consider the module as a whole.
- Each array should have between 1 and 5 items, prioritized by importance.
- Do NOT invent data. Only analyze what is provided.`

  const loSummariesSection =
    data.loFeedbackSummaries.length > 0
      ? `## Individual LO Feedback Summaries\n${data.loFeedbackSummaries.map((lo) => `### ${lo.loTitle}\n${lo.summary}`).join('\n\n')}`
      : '## Individual LO Feedback Summaries\nNo individual feedback available yet.'

  const topQuestionsSection =
    data.topForumQuestions.length > 0
      ? `## Top Forum Questions Across Module\n${data.topForumQuestions.map((q) => `- [${q.loTitle}] "${q.question}" (upvotes: ${q.upvotes})`).join('\n')}`
      : '## Top Forum Questions\nNo forum questions available.'

  const user = `# Module: "${data.moduleTitle}"
# Total enrolled students: ${data.totalStudents}
# Global activity correct rate: ${(data.globalActivityCorrectRate * 100).toFixed(1)}%

${loSummariesSection}

${topQuestionsSection}`

  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ]
}
