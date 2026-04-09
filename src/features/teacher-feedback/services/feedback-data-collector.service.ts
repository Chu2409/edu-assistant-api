import { Injectable, Logger } from '@nestjs/common'
import { DBService } from 'src/core/database/database.service'
import { compileBlocksToText } from 'src/features/learning-objects/blocks/helpers/compile-blocks'
import {
  LoInteractionData,
  ModuleInteractionData,
} from '../interfaces/feedback-data.interface'
import {
  MAX_CHAT_MESSAGES_PER_LO,
  MAX_FORUM_QUESTIONS_PER_LO,
  MAX_STUDENT_NOTES_PER_LO,
} from '../constants/thresholds'

@Injectable()
export class FeedbackDataCollectorService {
  private readonly logger = new Logger(FeedbackDataCollectorService.name)

  constructor(private readonly dbService: DBService) {}

  /**
   * Recopila todas las interacciones de estudiantes para un LO específico.
   * Los datos del chat se recopilan de forma anónima (sin identificar al estudiante).
   */
  async collectLoData(learningObjectId: number): Promise<LoInteractionData> {
    const lo = await this.dbService.learningObject.findUniqueOrThrow({
      where: { id: learningObjectId },
      include: { blocks: { orderBy: { orderIndex: 'asc' } } },
    })

    const [
      chatSessions,
      activities,
      feedbacks,
      questions,
      notes,
      distinctStudents,
    ] = await Promise.all([
      // Chat anónimo: traemos mensajes sin userId
      this.dbService.session.findMany({
        where: { learningObjectId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
            take: MAX_CHAT_MESSAGES_PER_LO,
            select: { role: true, content: true },
            where: {
              role: 'user',
            },
          },
        },
      }),

      // Actividades con sus intentos agregados
      this.dbService.activity.findMany({
        where: { learningObjectId },
        include: {
          attempts: {
            select: { isCorrect: true },
          },
        },
      }),

      // Feedbacks de estudiantes
      this.dbService.learningObjectFeedback.findMany({
        where: { learningObjectId },
        select: { feedback: true },
        take: MAX_STUDENT_NOTES_PER_LO,
        orderBy: { createdAt: 'desc' },
      }),

      // Preguntas del foro
      this.dbService.studentQuestion.findMany({
        where: { learningObjectId },
        include: {
          _count: { select: { replies: true } },
        },
        orderBy: { upvotes: 'desc' },
        take: MAX_FORUM_QUESTIONS_PER_LO,
      }),

      // Notas de estudiantes
      this.dbService.note.findMany({
        where: { learningObjectId },
        select: { content: true },
        take: MAX_STUDENT_NOTES_PER_LO,
        orderBy: { createdAt: 'desc' },
      }),

      // Cantidad de estudiantes distintos que interactuaron
      this.getDistinctStudentCount(learningObjectId),
    ])

    // Aplanar todos los mensajes del chat (anónimo)
    const chatMessages = chatSessions.flatMap((s) =>
      s.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    )

    // Calcular resultados de actividades
    const activityResults = activities.map((a) => {
      const total = a.attempts.length
      const correct = a.attempts.filter((att) => att.isCorrect).length
      return {
        question: a.question,
        totalAttempts: total,
        correctRate: total > 0 ? correct / total : 0,
      }
    })

    const totalInteractions =
      chatMessages.length +
      feedbacks.length +
      questions.length +
      notes.length +
      activities.reduce((sum, a) => sum + a.attempts.length, 0)

    return {
      loId: lo.id,
      loTitle: lo.title,
      loContent: compileBlocksToText(lo.blocks),
      chatMessages,
      totalChatSessions: chatSessions.length,
      activityResults,
      studentFeedbacks: feedbacks.map((f) => f.feedback),
      forumQuestions: questions.map((q) => ({
        question: q.question,
        upvotes: q.upvotes,
        repliesCount: q._count.replies,
      })),
      studentNotes: notes.map((n) => n.content),
      totalStudentsInteracted: distinctStudents,
      totalInteractions,
    }
  }

  /**
   * Recopila datos agregados a nivel de módulo para el meta-feedback.
   */
  async collectModuleData(
    moduleId: number,
    loFeedbackSummaries: { loTitle: string; summary: string }[],
  ): Promise<ModuleInteractionData> {
    const mod = await this.dbService.module.findUniqueOrThrow({
      where: { id: moduleId },
      include: {
        _count: { select: { enrollments: true } },
      },
    })

    // Tasa de acierto global de actividades del módulo
    const activities = await this.dbService.activity.findMany({
      where: { learningObject: { moduleId } },
      include: { attempts: { select: { isCorrect: true } } },
    })

    const allAttempts = activities.flatMap((a) => a.attempts)
    const globalCorrectRate =
      allAttempts.length > 0
        ? allAttempts.filter((a) => a.isCorrect).length / allAttempts.length
        : 0

    // Top preguntas del foro del módulo
    const topQuestions = await this.dbService.studentQuestion.findMany({
      where: { learningObject: { moduleId } },
      include: { learningObject: { select: { title: true } } },
      orderBy: { upvotes: 'desc' },
      take: 10,
    })

    return {
      moduleTitle: mod.title,
      totalStudents: mod._count.enrollments,
      loFeedbackSummaries,
      globalActivityCorrectRate: globalCorrectRate,
      topForumQuestions: topQuestions.map((q) => ({
        question: q.question,
        upvotes: q.upvotes,
        loTitle: q.learningObject.title,
      })),
    }
  }

  /**
   * Cuenta estudiantes distintos que han interactuado con un LO.
   * Unifica: chat sessions, feedbacks, notas, preguntas, intentos de actividad.
   */
  private async getDistinctStudentCount(
    learningObjectId: number,
  ): Promise<number> {
    const studentIds = new Set<number>()

    const [sessions, feedbacks, notes, questions, attempts] = await Promise.all(
      [
        this.dbService.session.findMany({
          where: { learningObjectId },
          select: { userId: true },
        }),
        this.dbService.learningObjectFeedback.findMany({
          where: { learningObjectId },
          select: { userId: true },
        }),
        this.dbService.note.findMany({
          where: { learningObjectId },
          select: { userId: true },
        }),
        this.dbService.studentQuestion.findMany({
          where: { learningObjectId },
          select: { userId: true },
        }),
        this.dbService.activityAttempt.findMany({
          where: { activity: { learningObjectId } },
          select: { userId: true },
        }),
      ],
    )

    for (const s of sessions) studentIds.add(s.userId)
    for (const f of feedbacks) studentIds.add(f.userId)
    for (const n of notes) studentIds.add(n.userId)
    for (const q of questions) studentIds.add(q.userId)
    for (const a of attempts) studentIds.add(a.userId)

    return studentIds.size
  }
}
