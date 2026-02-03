import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common'
import { DBService } from 'src/core/database/database.service'
import { Enrollment, Role, type User } from 'src/core/database/generated/client'

@Injectable()
export class PagesHelperService {
  constructor(private readonly dbService: DBService) {}

  async getPageForRead(pageId: number, user: User) {
    const page = await this.dbService.page.findUnique({
      where: { id: pageId },
      include: {
        module: { include: { enrollments: true, aiConfiguration: true } },
      },
    })

    if (!page) {
      throw new NotFoundException(`Página con ID ${pageId} no encontrada`)
    }

    if (user.role === Role.ADMIN) return page

    if (user.role === Role.TEACHER) {
      if (page.module.teacherId !== user.id) {
        throw new ForbiddenException(
          'No tienes permisos para acceder a esta página',
        )
      }
      return page
    }

    const hasAccess =
      page.module.isPublic ||
      page.module.enrollments.some(
        (enrollment: Enrollment) =>
          enrollment.userId === user.id && enrollment.isActive,
      )

    if (!hasAccess) {
      throw new ForbiddenException(
        'No tienes permisos para acceder a esta página',
      )
    }
    if (!page.isPublished) {
      throw new ForbiddenException('Esta página no está publicada aún')
    }
    return page
  }

  async getPageForWrite(pageId: number, user: User) {
    const page = await this.dbService.page.findUnique({
      where: { id: pageId },
      include: { module: true },
    })

    if (!page) {
      throw new NotFoundException(`Página con ID ${pageId} no encontrada`)
    }

    if (user.role === Role.ADMIN) return page

    if (page.module.teacherId !== user.id) {
      throw new ForbiddenException(
        'Solo el profesor propietario puede modificar esta página',
      )
    }

    return page
  }
}
