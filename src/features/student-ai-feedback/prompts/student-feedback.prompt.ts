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

  const system = `You are an expert educational tutor for the NousAI platform. NousAI is an educational platform where students learn through Learning Objects (contenido educativo), Activities (actividades prácticas), Forum Questions (preguntas al comunidad), and Chat Sessions.

Your task is to analyze a student's weekly interaction data and provide personalized, actionable feedback.

Reply ONLY with a valid JSON object in the following language: ${language}.

# OUTPUT FORMAT (strict JSON)
{
  "greeting": "Warm greeting for the student, mentioning their name (1 sentence)",
  "weeklySummary": "Brief summary of the student's week in the module (2-3 sentences). Include specific numbers when available.",
  "areasOfDifficulty": [
    {
      "concept": "specific concept or topic",
      "explanation": "why this is difficult and what confuses the student",
      "relatedLoTitle": "title of the learning object where this appears"
    }
  ],
  "recommendedActions": [
    {
      "loTitle": "specific learning object title to revisit",
      "loId": number,
      "reason": "why this LO is recommended",
      "studyTip": "concrete study strategy for this student"
    }
  ],
  "vocabularyTips": [
    {
      "term": "technical term",
      "definition": "simple definition",
      "usageExample": "example in context"
    }
  ],
  "encouragement": "Motivational message for the student (1-2 sentences)"
}

# RULES
- Address the student by name with warmth and encouragement.
- The greeting MUST include the module name: "Hola {studentName}, aquí está tu resumen de {moduleTitle}."
- Focus on the STUDENT's specific difficulties, not aggregated class data.
- Be specific: name the exact concepts, LOs, and strategies.
- Study tips should be concrete and actionable (e.g., "Revisá el capítulo 3 sobre X", not just "study more").
- Vocabulary tips should use simple language the student can understand.
- If there are no difficult areas, return empty arrays for areasOfDifficulty and vocabularyTips.
- If no LOs are recommended, return empty array for recommendedActions.
- NEVER mention 'AI' or 'system' in the output.
- Keep the tone supportive and motivating — this is a weekly learning companion, not a critique.`

  const activitySection =
    data.activityResults.length > 0
      ? `## Activities Completed
${data.activityResults.map((a) => `- "${a.question}" | Attempts: ${a.totalAttempts} | Correct: ${a.correct} | Success Rate: ${(a.correctRate * 100).toFixed(0)}%`).join('\n')}`
      : '## Activities Completed\nNo activities attempted this week.'

  const failedConceptsSection =
    data.failedConcepts.length > 0
      ? `## Concepts with Mistakes
${data.failedConcepts.map((c) => `- "${c.concept}" (appeared in "${c.loTitle}")`).join('\n')}`
      : '## Concepts with Mistakes\nNo specific concepts identified.'

  const completedLosSection =
    data.completedLos.length > 0
      ? `## Learning Objects Completed Successfully
${data.completedLos.map((lo) => `- "${lo.title}"`).join('\n')}`
      : '## Learning Objects Completed Successfully\nNo LOs completed this week.'

  const recommendedLosSection =
    data.recommendedLos.length > 0
      ? `## Recommended Learning Objects (based on their difficulties)
${data.recommendedLos.map((lo) => `- "${lo.title}" (reason: ${lo.reason})`).join('\n')}`
      : '## Recommended Learning Objects\nNo specific recommendations available.'

  const user = `# Student: ${studentName}
# Module: "${data.moduleTitle}"
# Week of: ${data.weekStartDate} to ${data.weekEndDate}

${completedLosSection}

${activitySection}

${failedConceptsSection}

${recommendedLosSection}`

  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ]
}