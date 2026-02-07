import { QuestionReply, User } from 'src/core/database/generated/client'
import { UsersMapper } from 'src/features/users/mappers/users.mapper'
import { QuestionReplyDto } from '../dtos/res/question-reply.dto'

export class QuestionRepliesMapper {
  static mapToDto(
    questionReply: QuestionReply & { user: User },
  ): QuestionReplyDto {
    return {
      id: questionReply.id,
      questionId: questionReply.questionId,
      user: UsersMapper.mapToDto(questionReply.user),
      replyText: questionReply.replyText,
      isFromTeacher: questionReply.isFromTeacher,
      createdAt: questionReply.createdAt,
    }
  }
}
