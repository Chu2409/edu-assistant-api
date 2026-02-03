import { Activity } from 'src/core/database/generated/client'
import { ActivityDto } from '../dtos/res/activity.dto'

export class ActivitiesMapper {
  static mapToDto(activity: Activity): ActivityDto {
    return {
      id: activity.id,
      pageId: activity.pageId,
      type: activity.type as any,
      question: activity.question,
      options:
        (activity.options as any) === null
          ? null
          : typeof activity.options === 'string'
            ? JSON.parse(activity.options)
            : (activity.options as any),
      explanation: activity.explanation ?? null,
      difficulty: activity.difficulty,
      orderIndex: activity.orderIndex,
      isApprovedByTeacher: activity.isApprovedByTeacher,
      usedAsExample: activity.usedAsExample,
      generatedFromId: activity.generatedFromId ?? null,
      createdAt: activity.createdAt,
      updatedAt: activity.updatedAt,
    }
  }
}
