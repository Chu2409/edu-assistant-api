import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DBService } from 'src/core/database/database.service';
import { CreatePageFeedbackDto } from './dtos/req/create-page-feedback.dto';
import { UpdatePageFeedbackDto } from './dtos/req/update-page-feedback.dto';
import { PageFeedbacksMapper } from './mappers/page-feedbacks.mapper';

@Injectable()
export class PageFeedbacksService {
  constructor(private readonly dbService: DBService) {}

  async create(userId: number, createPageFeedbackDto: CreatePageFeedbackDto) {
    const newFeedback = await this.dbService.pageFeedback.create({
      data: {
        userId,
        ...createPageFeedbackDto,
      },
      include: {
        user: true,
      },
    });

    return PageFeedbacksMapper.mapToDto(newFeedback);
  }

  async update(
    id: number,
    userId: number,
    updatePageFeedbackDto: UpdatePageFeedbackDto,
  ) {
    const feedback = await this.dbService.pageFeedback.findUnique({
      where: { id },
    });

    if (!feedback) {
      throw new NotFoundException(`Feedback with ID ${id} not found`);
    }

    if (feedback.userId !== userId) {
      throw new ForbiddenException(
        'You are not allowed to update this feedback',
      );
    }

    const updatedFeedback = await this.dbService.pageFeedback.update({
      where: { id },
      data: {
        ...updatePageFeedbackDto,
      },
      include: {
        user: true,
      },
    });

    return PageFeedbacksMapper.mapToDto(updatedFeedback);
  }

  async delete(id: number, userId: number) {
    const feedback = await this.dbService.pageFeedback.findUnique({
      where: { id },
    });

    if (!feedback) {
      throw new NotFoundException(`Feedback with ID ${id} not found`);
    }

    if (feedback.userId !== userId) {
      throw new ForbiddenException(
        'You are not allowed to delete this feedback',
      );
    }

    await this.dbService.pageFeedback.delete({
      where: { id },
    });

    return;
  }
}