import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common'
import { BusinessException } from 'src/shared/exceptions/business.exception'
import { DBService } from 'src/core/database/database.service'
import { Enrollment, Role, type User } from 'src/core/database/generated/client'

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

    if (user.role === Role.ADMIN) return lo

    if (user.role === Role.TEACHER) {
      if (lo.module.teacherId !== user.id) {
        throw new BusinessException(
          'No tienes permisos para acceder a este objeto de aprendizaje',
          HttpStatus.FORBIDDEN,
        )
      }
      return lo
    }

    const hasAccess =
      lo.module.isPublic ||
      lo.module.enrollments.some(
        (enrollment: Enrollment) =>
          enrollment.userId === user.id && enrollment.isActive,
      )

    if (!hasAccess) {
      throw new BusinessException(
        'No tienes permisos para acceder a este objeto de aprendizaje',
        HttpStatus.FORBIDDEN,
      )
    }
    if (!lo.isPublished) {
      throw new BusinessException(
        'Este objeto de aprendizaje no está publicado aún',
        HttpStatus.FORBIDDEN,
      )
    }
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

    if (user.role === Role.ADMIN) return lo

    if (lo.module.teacherId !== user.id) {
      throw new BusinessException(
        'Solo el profesor propietario puede modificar este objeto de aprendizaje',
        HttpStatus.FORBIDDEN,
      )
    }

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
