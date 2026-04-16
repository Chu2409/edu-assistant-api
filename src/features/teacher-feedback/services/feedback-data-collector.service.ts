import { Injectable, Logger } from '@nestjs/common'
import { DBService } from 'src/core/database/database.service'
import { compileBlocksToText } from 'src/features/learning-objects/blocks/helpers/compile-blocks'
import {
  LoInteractionData,
  ModuleInteractionData,
} from '../interfaces/feedback-data.interface'
import {
  MAX_CHAT_MESSAGES_PER_LO,
  MAX_FEEDBACKS_PER_LO,
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

    const [chatSessions, activities, feedbacks, questions, notes] =
      await Promise.all([
        // Chat: traemos userId para conteo de estudiantes + mensajes
        this.dbService.session.findMany({
          where: { learningObjectId },
          select: {
            userId: true,
            messages: {
              orderBy: { createdAt: 'desc' },
              take: MAX_CHAT_MESSAGES_PER_LO,
              select: { role: true, content: true },
              where: { role: 'user' },
            },
          },
        }),

        // Actividades con intentos (incluye userId para conteo)
        this.dbService.activity.findMany({
          where: { learningObjectId },
          include: {
            attempts: {
              select: { isCorrect: true, userId: true },
            },
          },
        }),

        // Feedbacks de estudiantes (incluye userId para conteo)
        this.dbService.learningObjectFeedback.findMany({
          where: { learningObjectId },
          select: { feedback: true, userId: true },
          take: MAX_FEEDBACKS_PER_LO,
          orderBy: { createdAt: 'desc' },
        }),

        // Preguntas del foro (incluye userId para conteo)
        this.dbService.studentQuestion.findMany({
          where: { learningObjectId },
          select: {
            question: true,
            upvotes: true,
            userId: true,
            _count: { select: { replies: true } },
          },
          orderBy: { upvotes: 'desc' },
          take: MAX_FORUM_QUESTIONS_PER_LO,
        }),

        // Notas de estudiantes (incluye userId para conteo)
        this.dbService.note.findMany({
          where: { learningObjectId },
          select: { content: true, userId: true },
          take: MAX_STUDENT_NOTES_PER_LO,
          orderBy: { createdAt: 'desc' },
        }),
      ])

    // Conteo de estudiantes distintos directamente de los datos ya obtenidos
    const studentIds = new Set<number>()
    for (const s of chatSessions) studentIds.add(s.userId)
    for (const f of feedbacks) studentIds.add(f.userId)
    for (const n of notes) studentIds.add(n.userId)
    for (const q of questions) studentIds.add(q.userId)
    for (const a of activities) {
      for (const att of a.attempts) studentIds.add(att.userId)
    }

    // Aplanar mensajes del chat (anónimo, más recientes primero)
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
      totalStudentsInteracted: studentIds.size,
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
   * Verifica si hay datos nuevos de interacción para un LO desde una fecha dada.
   * Usa queries de conteo ligeras para evitar cargar datos innecesarios.
   */
  async hasNewDataSince(
    learningObjectId: number,
    since: Date,
  ): Promise<boolean> {
    const dateFilter = { createdAt: { gt: since } }

    const [newMessages, newAttempts, newFeedbacks, newQuestions, newNotes] =
      await Promise.all([
        this.dbService.message.count({
          where: {
            session: { learningObjectId },
            ...dateFilter,
          },
        }),
        this.dbService.activityAttempt.count({
          where: {
            activity: { learningObjectId },
            ...dateFilter,
          },
        }),
        this.dbService.learningObjectFeedback.count({
          where: { learningObjectId, ...dateFilter },
        }),
        this.dbService.studentQuestion.count({
          where: { learningObjectId, ...dateFilter },
        }),
        this.dbService.note.count({
          where: { learningObjectId, ...dateFilter },
        }),
      ])

    const totalNew =
      newMessages + newAttempts + newFeedbacks + newQuestions + newNotes

    this.logger.log(
      `LO ${learningObjectId}: ${totalNew} interacciones nuevas desde ${since.toISOString()}`,
    )

    return totalNew > 0
  }
}
