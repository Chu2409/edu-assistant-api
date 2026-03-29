import { ForbiddenException, Injectable } from '@nestjs/common'
import { DBService } from 'src/core/database/database.service'
import { CreateStudentQuestionDto } from './dtos/req/create-student-question.dto'
import { UpdateStudentQuestionDto } from './dtos/req/update-student-question.dto'
import { StudentQuestionsMapper } from './mappers/student-questions.mapper'
import { StudentQuestionDto } from './dtos/res/student-question.dto'

@Injectable()
export class StudentQuestionsService {
  constructor(private readonly dbService: DBService) {}

  async create(
    userId: number,
    createStudentQuestionDto: CreateStudentQuestionDto,
  ): Promise<StudentQuestionDto> {
    const studentQuestion = await this.dbService.studentQuestion.create({
      data: {
        ...createStudentQuestionDto,
        userId,
        isPublic: createStudentQuestionDto.isPublic ?? true,
      },
      include: {
        user: true,
      },
    })
    return StudentQuestionsMapper.mapToDto(studentQuestion)
  }

  async update(
    userId: number,
    questionId: number,
    updateStudentQuestionDto: UpdateStudentQuestionDto,
  ): Promise<StudentQuestionDto> {
    const existingQuestion = await this.dbService.studentQuestion.findUnique({
      where: { id: questionId },
    })

    if (!existingQuestion || existingQuestion.userId !== userId) {
      throw new ForbiddenException(
        'No tienes permiso para actualizar esta pregunta.',
      )
    }

    const updatedQuestion = await this.dbService.studentQuestion.update({
      where: { id: questionId },
      data: {
        ...(updateStudentQuestionDto.question && {
          question: updateStudentQuestionDto.question,
        }),
        ...(updateStudentQuestionDto.isPublic !== undefined && {
          isPublic: updateStudentQuestionDto.isPublic,
        }),
      },
      include: {
        user: true,
      },
    })

    return StudentQuestionsMapper.mapToDto(updatedQuestion)
  }

  async delete(userId: number, questionId: number): Promise<void> {
    const existingQuestion = await this.dbService.studentQuestion.findUnique({
      where: { id: questionId },
    })

    if (!existingQuestion || existingQuestion.userId !== userId) {
      throw new ForbiddenException(
        'No tienes permiso para eliminar esta pregunta.',
      )
    }

    await this.dbService.studentQuestion.delete({
      where: { id: questionId },
    })
  }
}
