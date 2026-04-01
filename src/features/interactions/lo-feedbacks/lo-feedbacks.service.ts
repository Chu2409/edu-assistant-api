import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { DBService } from 'src/core/database/database.service'
import { CreateLoFeedbackDto } from './dtos/req/create-lo-feedback.dto'
import { UpdateLoFeedbackDto } from './dtos/req/update-lo-feedback.dto'
import { LoFeedbacksMapper } from './mappers/lo-feedbacks.mapper'

@Injectable()
export class LoFeedbacksService {
  constructor(private readonly dbService: DBService) {}

  async create(userId: number, createPageFeedbackDto: CreateLoFeedbackDto) {
    const newFeedback = await this.dbService.learningObjectFeedback.create({
      data: {
        userId,
        ...createPageFeedbackDto,
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
    updatePageFeedbackDto: UpdateLoFeedbackDto,
  ) {
    const feedback = await this.dbService.learningObjectFeedback.findUnique({
      where: { id },
    })

    if (!feedback) {
      throw new NotFoundException(`Feedback with ID ${id} not found`)
    }

    if (feedback.userId !== userId) {
      throw new ForbiddenException(
        'You are not allowed to update this feedback',
      )
    }

    const updatedFeedback = await this.dbService.learningObjectFeedback.update({
      where: { id },
      data: {
        ...updatePageFeedbackDto,
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
      throw new NotFoundException(`Feedback with ID ${id} not found`)
    }

    if (feedback.userId !== userId) {
      throw new ForbiddenException(
        'You are not allowed to delete this feedback',
      )
    }

    await this.dbService.learningObjectFeedback.delete({
      where: { id },
    })

    return
  }
}
