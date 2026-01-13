import { PageFeedback, User } from 'src/core/database/generated/client'
import { PageFeedbackDto } from '../dtos/res/page-feedback.dto'
import { UsersMapper } from 'src/features/users/mappers/users.mapper'

export class PageFeedbacksMapper {
  static mapToDto(
    pageFeedback: PageFeedback & { user: User },
  ): PageFeedbackDto {
    return {
      id: pageFeedback.id,
      user: UsersMapper.mapToDto(pageFeedback.user),
      feedback: pageFeedback.feedback,
      createdAt: pageFeedback.createdAt,
      updatedAt: pageFeedback.updatedAt,
    }
  }
}
