import {
  StudentQuestion,
  User,
  QuestionReply,
} from 'src/core/database/generated/client'
import { UsersMapper } from 'src/features/users/mappers/users.mapper'
import { StudentQuestionDto } from '../dtos/res/student-question.dto'
import { QuestionRepliesMapper } from '../../question-replies/mappers/question-replies.mapper'

export class StudentQuestionsMapper {
  static mapToDto(
    studentQuestion: StudentQuestion & {
      user: User
      replies?: (QuestionReply & { user: User })[]
    },
  ): StudentQuestionDto {
    return {
      id: studentQuestion.id,
      user: UsersMapper.mapToDto(studentQuestion.user),
      learningObjectId: studentQuestion.learningObjectId,
      question: studentQuestion.question,
      isPublic: studentQuestion.isPublic,
      upvotes: studentQuestion.upvotes,
      replies: studentQuestion.replies
        ? studentQuestion.replies.map((reply) =>
            QuestionRepliesMapper.mapToDto(reply),
          )
        : [],
      createdAt: studentQuestion.createdAt,
      updatedAt: studentQuestion.updatedAt,
    }
  }
}
