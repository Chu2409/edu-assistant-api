export interface BaseEmailData {
  logoUrl: string
  year: number
  subject: string
}

export interface TeacherEnrollmentEmailData extends BaseEmailData {
  studentName: string
  moduleTitle: string
  dashboardUrl: string
}

export interface TeacherFeedbackEmailData extends BaseEmailData {
  moduleTitle: string
  reportUrl: string
  date: string
}
