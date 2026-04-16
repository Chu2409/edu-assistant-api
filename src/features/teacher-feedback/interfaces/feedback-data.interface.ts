export interface LoInteractionData {
  loId: number
  loTitle: string
  loContent: string

  // Chat (anónimo)
  chatMessages: { role: string; content: string }[]
  totalChatSessions: number

  // Actividades
  activityResults: {
    question: string
    totalAttempts: number
    correctRate: number
  }[]

  // Feedback de estudiantes
  studentFeedbacks: string[]

  // Preguntas del foro
  forumQuestions: {
    question: string
    upvotes: number
    repliesCount: number
  }[]

  // Notas
  studentNotes: string[]

  // Métricas resumen
  totalStudentsInteracted: number
  totalInteractions: number
}

export interface ModuleInteractionData {
  moduleTitle: string
  totalStudents: number
  loFeedbackSummaries: {
    loTitle: string
    summary: string
  }[]
  globalActivityCorrectRate: number
  topForumQuestions: {
    question: string
    upvotes: number
    loTitle: string
  }[]
}

export interface AiFeedbackContent {
  summary: string
  strengths: AiFeedbackItem[]
  improvements: AiFeedbackItem[]
  recommendations: AiFeedbackItem[]
}

export interface AiFeedbackItem {
  topic: string
  detail: string
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
}
