import { Injectable } from '@nestjs/common'
import { DBService } from 'src/core/database/database.service'
import {
  ModuleAnalyticsDto,
  LoAnalyticsDto,
} from './dtos/res/module-analytics.dto'

@Injectable()
export class ModuleAnalyticsService {
  constructor(private readonly db: DBService) {}

  async getModuleAnalytics(moduleId: number): Promise<ModuleAnalyticsDto> {
    // 1. Fetch total active students from enrollments
    const totalStudents = await this.db.enrollment.count({
      where: {
        moduleId,
        isActive: true,
      },
    })

    // 2. Optimized raw SQL aggregation for LO metrics
    const metrics: any[] = await this.db.$queryRaw`
      SELECT 
          lo.id,
          lo.title,
          lo.order_index as "orderIndex",
          COUNT(DISTINCT lp.user_id)::int as "uniqueViews",
          COUNT(DISTINCT CASE WHEN lp.is_completed = true THEN lp.user_id END)::int as "completions",
          COUNT(DISTINCT aa.user_id)::int as "activityEngagement"
      FROM learning_objects lo
      LEFT JOIN lo_progress lp ON lo.id = lp.learning_object_id
      LEFT JOIN activities a ON lo.id = a.learning_object_id
      LEFT JOIN activity_attempts aa ON a.id = aa.activity_id
      WHERE lo.module_id = ${moduleId}
      GROUP BY lo.id, lo.title, lo.order_index
      ORDER BY lo.order_index ASC;
    `

    // 3. Fetch and group qualitative feedback
    const feedbackEntries = await this.db.learningObjectFeedback.findMany({
      where: {
        learningObject: {
          moduleId,
        },
      },
      select: {
        learningObjectId: true,
        feedback: true,
      },
    })

    const feedbackMap = new Map<number, string[]>()
    feedbackEntries.forEach((entry) => {
      if (!entry.learningObjectId) return
      const list = feedbackMap.get(entry.learningObjectId) || []
      list.push(entry.feedback)
      feedbackMap.set(entry.learningObjectId, list)
    })

    // 4. Map data to DTOs and calculate rates
    const loAnalytics: LoAnalyticsDto[] = metrics.map((m) => {
      const uniqueViews = m.uniqueViews || 0
      const completions = m.completions || 0
      const activityEngagement = m.activityEngagement || 0

      // Calculate rates (handle zero-view edge cases)
      const completionRate =
        uniqueViews > 0 ? Math.round((completions / uniqueViews) * 100) : 0

      const dropOffRate =
        uniqueViews > 0
          ? Math.round((1 - activityEngagement / uniqueViews) * 100)
          : 0

      return {
        id: m.id,
        title: m.title,
        orderIndex: m.orderIndex,
        uniqueViews,
        completions,
        completionRate,
        activityEngagement,
        dropOffRate,
        feedbacks: feedbackMap.get(m.id) || [],
      }
    })

    return {
      moduleId,
      totalStudents,
      loAnalytics,
    }
  }
}
