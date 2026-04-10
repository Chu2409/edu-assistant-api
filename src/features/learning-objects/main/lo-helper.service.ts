import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common'
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
        throw new ForbiddenException(
          'No tienes permisos para acceder a este objeto de aprendizaje',
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
      throw new ForbiddenException(
        'No tienes permisos para acceder a este objeto de aprendizaje',
      )
    }
    if (!lo.isPublished) {
      throw new ForbiddenException(
        'Este objeto de aprendizaje no está publicado aún',
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
      throw new ForbiddenException(
        'Solo el profesor propietario puede modificar este objeto de aprendizaje',
      )
    }

    return lo
  }
}
