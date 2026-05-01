import type { StudentAiFeedback } from 'src/core/database/generated/client'
import type { StudentAiFeedbackContent } from '../interfaces/student-feedback-data.interface'
import { StudentFeedbackDto } from '../dtos/res/student-feedback.dto'

export class StudentFeedbackMapper {
  static toDto(entity: StudentAiFeedback): StudentFeedbackDto {
    return {
      id: entity.id,
      scope: entity.scope,
      moduleId: entity.moduleId,
      content: entity.content as unknown as StudentAiFeedbackContent,
      createdAt: entity.createdAt,
    }
  }
}