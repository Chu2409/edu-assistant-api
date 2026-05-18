import { Injectable, NotFoundException } from '@nestjs/common'
import { DBService } from 'src/core/database/database.service'
import { type User, Prisma } from 'src/core/database/generated/client'
import { AuthorizationUtils } from 'src/shared/utils/authorization.util'
import { compileBlocksToText } from '../blocks/helpers/compile-blocks'
import { InjectQueue } from '@nestjs/bullmq'
import { QUEUE_NAMES } from 'src/shared/constants/queues'
import { Queue } from 'bullmq'

@Injectable()
export class LoHelperService {
  constructor(
    private readonly dbService: DBService,
    @InjectQueue(QUEUE_NAMES.EMBEDDINGS.NAME)
    private readonly embeddingsQueue: Queue,
  ) {}

  async triggerEmbeddingUpdate(loId: number, isPublished: boolean) {
    if (!isPublished) {
      return
    }

    await this.embeddingsQueue.add(
      QUEUE_NAMES.EMBEDDINGS.JOBS.PROCESS_LO,
      { learningObjectId: loId },
      {
        jobId: `lo-embedding-${loId}`,
        removeOnComplete: true,
      },
    )
  }

  async updateCompiledContent(tx: Prisma.TransactionClient, loId: number) {
    const blocks = await tx.block.findMany({
      where: { learningObjectId: loId },
      orderBy: { orderIndex: 'asc' },
    })

    if (blocks.length === 0) {
      return
    }

    const compiledContent = compileBlocksToText(blocks)

    await tx.learningObject.update({
      where: { id: loId },
      data: { compiledContent },
    })
  }

  async getLoForRead(learningObjectId: number, user: User) {
    const lo = await this.dbService.learningObject.findUnique({
      where: { id: learningObjectId },
      include: {
        module: { include: { enrollments: true, aiConfiguration: true } },
      },
    })

    if (!lo) {
      throw new NotFoundException(
        `Objeto de aprendizaje con ID ${learningObjectId} no encontrado`,
      )
    }

    AuthorizationUtils.assertLoReadAccess(user, lo.module, lo)

    return lo
  }

  async getLoForWrite(learningObjectId: number, user: User) {
    const lo = await this.dbService.learningObject.findUnique({
      where: { id: learningObjectId },
      include: { module: true },
    })

    if (!lo) {
      throw new NotFoundException(
        `Objeto de aprendizaje con ID ${learningObjectId} no encontrado`,
      )
    }

    AuthorizationUtils.assertLoWriteAccess(user, lo.module)

    return lo
  }

  async getNextOrderIndex(moduleId: number): Promise<number> {
    const last = await this.dbService.learningObject.findFirst({
      where: { moduleId },
      orderBy: { orderIndex: 'desc' },
      select: { orderIndex: true },
    })

    return last ? last.orderIndex + 1 : 1
  }
}
