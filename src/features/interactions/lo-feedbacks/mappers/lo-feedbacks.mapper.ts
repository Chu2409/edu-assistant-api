import {
  LearningObjectFeedback,
  User,
} from 'src/core/database/generated/client'
import { LoFeedbackDto } from '../dtos/res/lo-feedback.dto'
import { UsersMapper } from 'src/features/users/mappers/users.mapper'

export class LoFeedbacksMapper {
  static mapToDto(
    loFeedback: LearningObjectFeedback & { user: User },
  ): LoFeedbackDto {
    return {
      id: loFeedback.id,
      user: UsersMapper.mapToDto(loFeedback.user),
      feedback: loFeedback.feedback,
      createdAt: loFeedback.createdAt,
      updatedAt: loFeedback.updatedAt,
    }
  }
}
