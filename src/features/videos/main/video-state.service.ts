import { HttpStatus, Injectable } from '@nestjs/common'
import { IngestionStatus, Prisma } from 'src/core/database/generated/client'
import { DBService } from 'src/core/database/database.service'
import { BusinessException } from 'src/shared/exceptions/business.exception'

const ALLOWED_TRANSITIONS: Record<IngestionStatus, IngestionStatus[]> = {
  [IngestionStatus.PENDING]: [
    IngestionStatus.EXTRACTING,
    IngestionStatus.FAILED,
  ],
  [IngestionStatus.EXTRACTING]: [
    IngestionStatus.GENERATING,
    IngestionStatus.FAILED,
  ],
  [IngestionStatus.GENERATING]: [
    IngestionStatus.COMPLETED,
    IngestionStatus.FAILED,
  ],
  [IngestionStatus.COMPLETED]: [IngestionStatus.GENERATING],
  [IngestionStatus.FAILED]: [
    IngestionStatus.GENERATING,
    IngestionStatus.EXTRACTING,
  ],
}

export type StateClient = DBService | Prisma.TransactionClient

@Injectable()
export class VideoStateService {
  constructor(private readonly dbService: DBService) {}

  async transition(
    videoId: number,
    next: IngestionStatus,
    extra?: { errorMessage?: string | null },
    client: StateClient = this.dbService,
  ): Promise<void> {
    const current = await client.video.findUniqueOrThrow({
      where: { learningObjectId: videoId },
      select: { status: true },
    })

    if (!this.canTransition(current.status, next)) {
      throw new BusinessException(
        `Invalid video state transition: ${current.status} -> ${next}`,
        HttpStatus.CONFLICT,
      )
    }

    await client.video.update({
      where: { learningObjectId: videoId },
      data: {
        status: next,
        errorMessage: extra?.errorMessage ?? null,
      },
    })
  }

  canTransition(current: IngestionStatus, next: IngestionStatus): boolean {
    return ALLOWED_TRANSITIONS[current].includes(next)
  }
}
