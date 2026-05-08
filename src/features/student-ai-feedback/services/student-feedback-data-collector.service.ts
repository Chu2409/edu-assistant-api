import { Injectable, Logger } from '@nestjs/common'
import { DBService } from 'src/core/database/database.service'
import type {
  StudentInteractionData,
  StudentActivityResult,
  FailedConcept,
  RecommendedLo,
} from '../interfaces/student-feedback-data.interface'

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

    // Get all LOs in this module for the student
    const learningObjects = await this.dbService.learningObject.findMany({
      where: { moduleId, isPublished: true },
      select: { id: true, title: true },
    })

    const loIds = learningObjects.map((lo) => lo.id)
    const loMap = new Map(learningObjects.map((lo) => [lo.id, lo.title]))

    // Fetch all attempts for this student in this module's LOs
    const allAttempts = await this.dbService.activityAttempt.findMany({
      where: {
        userId: studentId,
        createdAt: { gte: weekStartDate, lte: weekEndDate },
        activity: {
          learningObjectId: { in: loIds },
        },
      },
      include: {
        activity: {
          include: {
            learningObject: {
              select: { id: true, title: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Calculate activity results by grouping attempts per activity
    const activityMap = new Map<number, StudentActivityResult>()
    const failedAttemptsByLo = new Map<number, typeof allAttempts>()
    const completedLoIds = new Set<number>()

    for (const attempt of allAttempts) {
      const activityId = attempt.activityId
      const loId = attempt.activity.learningObject.id
      const loTitle = attempt.activity.learningObject.title

      if (!activityMap.has(activityId)) {
        activityMap.set(activityId, {
          question: `Activity ${activityId}`,
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

    // Completed LOs (unique LOs with at least one correct attempt)
    const completedLos = Array.from(completedLoIds).map((id) => ({
      id,
      title: loMap.get(id) || `LO ${id}`,
    }))

    // Failed concepts (from activities with failed attempts)
    const conceptErrors = new Map<
      string,
      { concept: string; loTitle: string; count: number }
    >()
    for (const [loId, attempts] of failedAttemptsByLo.entries()) {
      const loTitle = loMap.get(loId) || `LO ${loId}`
      for (const attempt of attempts) {
        // For now, we'll use the loTitle as the concept since we don't have concept mentions here
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

    // Recommended LOs based on failed LOs (suggest related LOs they haven't completed)
    const recommendedLosData: RecommendedLo[] = []
    const failedLoIds = Array.from(failedAttemptsByLo.keys())

    for (const loId of failedLoIds) {
      const relations = await this.dbService.learningObjectRelation.findMany({
        where: {
          originLoId: loId,
          similarityScore: { gte: 0.7 },
          OR: [
            { relationType: 'PREREQUISITE' },
            { relationType: 'COMPLEMENTARY' },
            { relationType: 'DEEPENING' },
          ],
        },
        include: {
          relatedLo: {
            select: { id: true, title: true },
          },
        },
      })

      for (const rel of relations) {
        if (completedLoIds.has(rel.relatedLoId)) continue
        if (recommendedLosData.some((r) => r.id === rel.relatedLoId)) continue

        const originTitle = loMap.get(loId) || `LO ${loId}`
        recommendedLosData.push({
          id: rel.relatedLo.id,
          title: rel.relatedLo.title,
          reason: `Relacionado con dificultades en "${originTitle}"`,
          similarityScore: rel.similarityScore,
        })
      }
    }

    // Totals
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
      recommendedLos: recommendedLosData,
      totalAttempts,
      totalCorrect,
      overallSuccessRate,
    }
  }
}
