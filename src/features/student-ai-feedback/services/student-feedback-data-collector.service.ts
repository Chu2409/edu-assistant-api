import { Injectable, Logger } from '@nestjs/common'
import { DBService } from 'src/core/database/database.service'
import type {
  StudentInteractionData,
  StudentActivityResult,
  FailedConcept,
  StudentChatMessage,
  StudentForumQuestion,
} from '../interfaces/student-feedback-data.interface'

/** Maximum chat messages to include per student (to avoid exceeding tokens) */
const MAX_CHAT_MESSAGES = 20

/** Maximum forum questions to include per student */
const MAX_FORUM_QUESTIONS = 10

@Injectable()
export class StudentFeedbackDataCollectorService {
  private readonly logger = new Logger(StudentFeedbackDataCollectorService.name)

  constructor(private readonly dbService: DBService) {}

  /**
   * Collects all interactions for a specific student in a module.
   */
  async collectStudentData(
    studentId: number,
    moduleId: number,
    weekStartDate: Date,
    weekEndDate: Date,
  ): Promise<StudentInteractionData> {
    const module = await this.dbService.module.findUniqueOrThrow({
      where: { id: moduleId },
      select: { id: true, title: true },
    })

    // Get all published LOs in this module
    const learningObjects = await this.dbService.learningObject.findMany({
      where: { moduleId, isPublished: true },
      select: { id: true, title: true },
    })

    const loIds = learningObjects.map((lo) => lo.id)
    const loMap = new Map(learningObjects.map((lo) => [lo.id, lo.title]))

    const dateFilter = { gte: weekStartDate, lte: weekEndDate }

    // Fetch all data in parallel
    const [allAttempts, chatSessions, forumQuestions] = await Promise.all([
      // Activity attempts for this student in this module's LOs during the week
      this.dbService.activityAttempt.findMany({
        where: {
          userId: studentId,
          createdAt: dateFilter,
          activity: {
            learningObjectId: { in: loIds },
          },
        },
        include: {
          activity: {
            select: {
              id: true,
              question: true,
              learningObject: {
                select: { id: true, title: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),

      // Chat messages from this student (user role only)
      this.dbService.session.findMany({
        where: {
          userId: studentId,
          learningObjectId: { in: loIds },
        },
        select: {
          learningObjectId: true,
          messages: {
            where: {
              role: 'user',
              createdAt: dateFilter,
            },
            select: { content: true },
            orderBy: { createdAt: 'desc' },
            take: MAX_CHAT_MESSAGES,
          },
        },
      }),

      // Forum questions from this student
      this.dbService.studentQuestion.findMany({
        where: {
          userId: studentId,
          learningObjectId: { in: loIds },
          createdAt: dateFilter,
        },
        select: {
          question: true,
          learningObjectId: true,
        },
        orderBy: { createdAt: 'desc' },
        take: MAX_FORUM_QUESTIONS,
      }),
    ])

    // --- Activity results ---
    const activityMap = new Map<number, StudentActivityResult>()
    const failedAttemptsByLo = new Map<number, typeof allAttempts>()
    const completedLoIds = new Set<number>()

    for (const attempt of allAttempts) {
      const activityId = attempt.activityId
      const loId = attempt.activity.learningObject.id
      const loTitle = attempt.activity.learningObject.title

      if (!activityMap.has(activityId)) {
        activityMap.set(activityId, {
          question: attempt.activity.question,
          loTitle,
          totalAttempts: 0,
          correct: 0,
          correctRate: 0,
        })
      }

      const stats = activityMap.get(activityId)!
      stats.totalAttempts++

      if (attempt.isCorrect) {
        stats.correct++
        completedLoIds.add(loId)
      }

      if (!attempt.isCorrect) {
        if (!failedAttemptsByLo.has(loId)) {
          failedAttemptsByLo.set(loId, [])
        }
        failedAttemptsByLo.get(loId)!.push(attempt)
      }
    }

    // Calculate correct rates
    for (const stats of activityMap.values()) {
      stats.correctRate =
        stats.totalAttempts > 0 ? stats.correct / stats.totalAttempts : 0
    }

    const activityResults = Array.from(activityMap.values()).filter(
      (a) => a.totalAttempts > 0,
    )

    // --- Completed LOs ---
    const completedLos = Array.from(completedLoIds).map((id) => ({
      id,
      title: loMap.get(id) || `LO ${id}`,
    }))

    // --- Failed concepts ---
    const conceptErrors = new Map<
      string,
      { concept: string; loTitle: string; count: number }
    >()
    for (const [loId, attempts] of failedAttemptsByLo.entries()) {
      const loTitle = loMap.get(loId) || `LO ${loId}`
      for (const _attempt of attempts) {
        const key = loTitle
        if (!conceptErrors.has(key)) {
          conceptErrors.set(key, { concept: key, loTitle, count: 0 })
        }
        conceptErrors.get(key)!.count++
      }
    }

    const failedConcepts: FailedConcept[] = Array.from(
      conceptErrors.values(),
    ).map((c) => ({
      concept: c.concept,
      loTitle: c.loTitle,
      errorCount: c.count,
    }))

    // --- Chat messages ---
    const chatMessages: StudentChatMessage[] = chatSessions.flatMap((session) =>
      session.messages.map((m) => ({
        loTitle:
          loMap.get(session.learningObjectId) ||
          `LO ${session.learningObjectId}`,
        content: m.content,
      })),
    )

    // --- Forum questions ---
    const studentForumQuestions: StudentForumQuestion[] = forumQuestions.map(
      (q) => ({
        loTitle: loMap.get(q.learningObjectId) || `LO ${q.learningObjectId}`,
        question: q.question,
      }),
    )

    // --- Totals ---
    const totalAttempts = activityResults.reduce(
      (sum, a) => sum + a.totalAttempts,
      0,
    )
    const totalCorrect = activityResults.reduce((sum, a) => sum + a.correct, 0)
    const overallSuccessRate =
      totalAttempts > 0 ? totalCorrect / totalAttempts : 0

    return {
      studentId,
      moduleTitle: module.title,
      weekStartDate: weekStartDate.toISOString().split('T')[0],
      weekEndDate: weekEndDate.toISOString().split('T')[0],
      activityResults,
      failedConcepts,
      completedLos,
      chatMessages,
      forumQuestions: studentForumQuestions,
      totalAttempts,
      totalCorrect,
      overallSuccessRate,
    }
  }
}
