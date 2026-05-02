export interface StudentActivityResult {
  question: string
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

export interface RecommendedLo {
  id: number
  title: string
  reason: string
  similarityScore?: number
}

export interface StudentInteractionData {
  studentId: number
  moduleTitle: string
  weekStartDate: string
  weekEndDate: string
  activityResults: StudentActivityResult[]
  failedConcepts: FailedConcept[]
  completedLos: CompletedLo[]
  recommendedLos: RecommendedLo[]
  totalAttempts: number
  totalCorrect: number
  overallSuccessRate: number
}

export interface StudentAiFeedbackContent {
  greeting: string
  weeklySummary: string
  areasOfDifficulty: {
    concept: string
    explanation: string
    relatedLoTitle: string
  }[]
  recommendedActions: {
    loTitle: string
    loId: number
    reason: string
    studyTip: string
  }[]
  vocabularyTips: {
    term: string
    definition: string
    usageExample: string
  }[]
  encouragement: string
}
