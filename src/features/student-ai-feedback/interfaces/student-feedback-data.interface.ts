export interface StudentActivityResult {
  question: string
  loTitle: string
  totalAttempts: number
  correct: number
  correctRate: number
}

export interface FailedConcept {
  concept: string
  loTitle: string
  errorCount: number
}

export interface CompletedLo {
  id: number
  title: string
}

export interface StudentChatMessage {
  loTitle: string
  content: string
}

export interface StudentForumQuestion {
  loTitle: string
  question: string
}

export interface StudentInteractionData {
  studentId: number
  moduleTitle: string
  weekStartDate: string
  weekEndDate: string
  activityResults: StudentActivityResult[]
  failedConcepts: FailedConcept[]
  completedLos: CompletedLo[]
  chatMessages: StudentChatMessage[]
  forumQuestions: StudentForumQuestion[]
  totalAttempts: number
  totalCorrect: number
  overallSuccessRate: number
}

export interface StudentAiFeedbackItem {
  topic: string
  detail: string
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
}

export interface StudentAiFeedbackContent {
  summary: string
  strengths: StudentAiFeedbackItem[]
  improvements: StudentAiFeedbackItem[]
  recommendations: StudentAiFeedbackItem[]
}
