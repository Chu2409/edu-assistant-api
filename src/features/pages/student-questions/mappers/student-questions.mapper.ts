import { StudentQuestion, User } from 'src/core/database/generated/client'
import { UsersMapper } from 'src/features/users/mappers/users.mapper'
import { StudentQuestionDto } from '../dtos/res/student-question.dto'

export class StudentQuestionsMapper {
  static mapToDto(
    studentQuestion: StudentQuestion & { user: User },
  ): StudentQuestionDto {
    return {
      id: studentQuestion.id,
      user: UsersMapper.mapToDto(studentQuestion.user),
      pageId: studentQuestion.pageId,
      question: studentQuestion.question,
      isPublic: studentQuestion.isPublic,
      upvotes: studentQuestion.upvotes,
      createdAt: studentQuestion.createdAt,
      updatedAt: studentQuestion.updatedAt,
    }
  }
}
