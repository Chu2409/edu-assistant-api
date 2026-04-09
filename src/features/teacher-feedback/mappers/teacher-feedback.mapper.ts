import type { TeacherAiFeedback } from 'src/core/database/generated/client'
import { TeacherFeedbackDto } from '../dtos/res/teacher-feedback.dto'
import type { AiFeedbackContent } from '../interfaces/feedback-data.interface'

export class TeacherFeedbackMapper {
  static toDto(entity: TeacherAiFeedback): TeacherFeedbackDto {
    return {
      id: entity.id,
      scope: entity.scope,
      moduleId: entity.moduleId,
      learningObjectId: entity.learningObjectId,
      content: entity.content as unknown as AiFeedbackContent,
      createdAt: entity.createdAt,
    }
  }
}
