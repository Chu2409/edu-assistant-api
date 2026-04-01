import {
  LearningObjectFeedback,
  User,
} from 'src/core/database/generated/client'
import { LoFeedbackDto } from '../dtos/res/lo-feedback.dto'
import { UsersMapper } from 'src/features/users/mappers/users.mapper'

export class LoFeedbacksMapper {
  static mapToDto(
    pageFeedback: LearningObjectFeedback & { user: User },
  ): LoFeedbackDto {
    return {
      id: pageFeedback.id,
      user: UsersMapper.mapToDto(pageFeedback.user),
      feedback: pageFeedback.feedback,
      createdAt: pageFeedback.createdAt,
      updatedAt: pageFeedback.updatedAt,
    }
  }
}
