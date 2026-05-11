import { Injectable } from '@nestjs/common'
import { DBService } from 'src/core/database/database.service'
import { MarkLoVisitedDto } from './dtos/req/mark-lo-visited.dto'
import { LoProgressDto } from './dtos/res/lo-progress.dto'

@Injectable()
export class LoProgressService {
  constructor(private readonly dbService: DBService) {}

  async markVisited(userId: number, dto: MarkLoVisitedDto): Promise<LoProgressDto> {
    const { learningObjectId, isCompleted } = dto

    const progress = await this.dbService.learningObjectProgress.upsert({
      where: {
        userId_learningObjectId: {
          userId,
          learningObjectId,
        },
      },
      update: {
        lastVisitedAt: new Date(),
        ...(isCompleted !== undefined && {
          isCompleted,
          completedAt: isCompleted ? new Date() : null,
        }),
      },
      create: {
        userId,
        learningObjectId,
        isCompleted: isCompleted ?? false,
        completedAt: isCompleted ? new Date() : null,
        lastVisitedAt: new Date(),
      },
    })

    return progress as LoProgressDto
  }

  async getProgress(userId: number, learningObjectId: number): Promise<LoProgressDto | null> {
    const progress = await this.dbService.learningObjectProgress.findUnique({
      where: {
        userId_learningObjectId: {
          userId,
          learningObjectId,
        },
      },
    })

    return progress as LoProgressDto | null
  }
}
