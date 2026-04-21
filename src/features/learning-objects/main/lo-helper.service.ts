import { Injectable, NotFoundException } from '@nestjs/common'
import { DBService } from 'src/core/database/database.service'
import { type User } from 'src/core/database/generated/client'
import { AuthorizationUtils } from 'src/shared/utils/authorization.util'

@Injectable()
export class LoHelperService {
  constructor(private readonly dbService: DBService) {}

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
