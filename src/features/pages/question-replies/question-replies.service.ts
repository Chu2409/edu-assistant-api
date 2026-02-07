import { ForbiddenException, Injectable } from '@nestjs/common'
import { DBService } from 'src/core/database/database.service'
import { CreateQuestionReplyDto } from './dtos/req/create-question-reply.dto'
import { UpdateQuestionReplyDto } from './dtos/req/update-question-reply.dto'
import { QuestionRepliesMapper } from './mappers/question-replies.mapper'
import { QuestionReplyDto } from './dtos/res/question-reply.dto'
import { Role } from 'src/core/database/generated/client'

@Injectable()
export class QuestionRepliesService {
  constructor(private readonly dbService: DBService) {}

  async create(
    userId: number,
    createQuestionReplyDto: CreateQuestionReplyDto,
  ): Promise<QuestionReplyDto> {
    // Verificar que la pregunta existe
    const question = await this.dbService.studentQuestion.findUnique({
      where: { id: createQuestionReplyDto.questionId },
    })

    if (!question) {
      throw new ForbiddenException('La pregunta no existe.')
    }

    const teacher = await this.dbService.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
      },
    })

    let isFromTeacher = false

    if (teacher?.role === Role.TEACHER) {
      isFromTeacher = true
    }

    const questionReply = await this.dbService.questionReply.create({
      data: {
        ...createQuestionReplyDto,
        userId,
        isFromTeacher,
      },
      include: {
        user: true,
      },
    })
    return QuestionRepliesMapper.mapToDto(questionReply)
  }

  async update(
    userId: number,
    replyId: number,
    updateQuestionReplyDto: UpdateQuestionReplyDto,
  ): Promise<QuestionReplyDto> {
    const existingReply = await this.dbService.questionReply.findUnique({
      where: { id: replyId },
    })

    if (!existingReply || existingReply.userId !== userId) {
      throw new ForbiddenException(
        'No tienes permiso para actualizar esta respuesta.',
      )
    }

    const updatedReply = await this.dbService.questionReply.update({
      where: { id: replyId },
      data: {
        ...(updateQuestionReplyDto.replyText && {
          replyText: updateQuestionReplyDto.replyText,
        }),
      },
      include: {
        user: true,
      },
    })

    return QuestionRepliesMapper.mapToDto(updatedReply)
  }

  async delete(userId: number, replyId: number): Promise<void> {
    const existingReply = await this.dbService.questionReply.findUnique({
      where: { id: replyId },
    })

    if (!existingReply || existingReply.userId !== userId) {
      throw new ForbiddenException(
        'No tienes permiso para eliminar esta respuesta.',
      )
    }

    await this.dbService.questionReply.delete({
      where: { id: replyId },
    })
  }
}
