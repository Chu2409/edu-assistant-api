import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common'
import { BusinessException } from 'src/shared/exceptions/business.exception'
import { DBService } from 'src/core/database/database.service'
import { CreateLoFeedbackDto } from './dtos/req/create-lo-feedback.dto'
import { UpdateLoFeedbackDto } from './dtos/req/update-lo-feedback.dto'
import { LoFeedbacksMapper } from './mappers/lo-feedbacks.mapper'

@Injectable()
export class LoFeedbacksService {
  constructor(private readonly dbService: DBService) {}

  async create(userId: number, createLoFeedbackDto: CreateLoFeedbackDto) {
    const newFeedback = await this.dbService.learningObjectFeedback.create({
      data: {
        userId,
        ...createLoFeedbackDto,
      },
      include: {
        user: true,
      },
    })

    return LoFeedbacksMapper.mapToDto(newFeedback)
  }

  async update(
    id: number,
    userId: number,
    updateLoFeedbackDto: UpdateLoFeedbackDto,
  ) {
    const feedback = await this.dbService.learningObjectFeedback.findUnique({
      where: { id },
    })

    if (!feedback) {
      throw new NotFoundException(`Feedback con ID ${id} no encontrado`)
    }

    if (feedback.userId !== userId) {
      throw new BusinessException(
        'No tienes permiso para actualizar este feedback',
        HttpStatus.FORBIDDEN,
      )
    }

    const updatedFeedback = await this.dbService.learningObjectFeedback.update({
      where: { id },
      data: {
        ...updateLoFeedbackDto,
      },
      include: {
        user: true,
      },
    })

    return LoFeedbacksMapper.mapToDto(updatedFeedback)
  }

  async delete(id: number, userId: number) {
    const feedback = await this.dbService.learningObjectFeedback.findUnique({
      where: { id },
    })

    if (!feedback) {
      throw new NotFoundException(`Feedback con ID ${id} no encontrado`)
    }

    if (feedback.userId !== userId) {
      throw new BusinessException(
        'No tienes permiso para eliminar este feedback',
        HttpStatus.FORBIDDEN,
      )
    }

    await this.dbService.learningObjectFeedback.delete({
      where: { id },
    })

    return
  }
}
