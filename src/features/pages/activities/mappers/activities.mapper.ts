import { Activity } from 'src/core/database/generated/client'
import { ActivityDto } from '../dtos/res/activity.dto'
import { parseJsonField } from 'src/providers/ai/helpers/utils'
import { AiGeneratedActivity } from '../../content-generation/interfaces/ai-generated-activity.interface'

export class ActivitiesMapper {
  static mapToDto(activity: Activity): ActivityDto {
    return {
      id: activity.id,
      pageId: activity.pageId,
      type: activity.type,
      question: activity.question,
      options: parseJsonField<AiGeneratedActivity>(activity.options),
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
