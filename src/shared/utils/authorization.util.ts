import { HttpStatus } from '@nestjs/common'
import { BusinessException } from '../exceptions/business.exception'
import { Role, type User } from 'src/core/database/generated/client'

export interface ModuleAccessData {
  teacherId: number
  isPublic: boolean
  isActive: boolean
  enrollments?: { userId: number; isActive: boolean }[]
}

export interface LoAccessData {
  isPublished: boolean
}

export const AuthorizationUtils = {
  assertModuleReadAccess(user: User, module: ModuleAccessData): void {
    if (user.role === Role.ADMIN) return

    // Profesor propietario tiene acceso siempre
    if (module.teacherId === user.id) return

    // Requiere matrícula activa (isPublic no aplica para acceso a contenido)
    const isEnrolled = module.enrollments?.some(
      (e) => e.userId === user.id && e.isActive,
    )

    if (module.isActive && isEnrolled) return

    throw new BusinessException(
      'No tienes permisos para acceder a este módulo',
      HttpStatus.FORBIDDEN,
    )
  },

  assertModuleWriteAccess(user: User, module: { teacherId: number }): void {
    if (user.role === Role.ADMIN) return

    if (module.teacherId === user.id && user.role === Role.TEACHER) return

    throw new BusinessException(
      'Solo el profesor propietario puede modificar este módulo',
      HttpStatus.FORBIDDEN,
    )
  },

  assertLoReadAccess(
    user: User,
    module: ModuleAccessData,
    lo: LoAccessData,
  ): void {
    if (user.role === Role.ADMIN) return

    // Profesor propietario tiene acceso total al LO sin importar si está publicado o no
    if (module.teacherId === user.id) return

    // Todos los demás usuarios requieren acceso de lectura al módulo padre...
    this.assertModuleReadAccess(user, module)

    // ... y además que el LO esté publicado
    if (!lo.isPublished) {
      throw new BusinessException(
        'Este objeto de aprendizaje no está publicado aún',
        HttpStatus.FORBIDDEN,
      )
    }
  },

  assertLoWriteAccess(user: User, module: { teacherId: number }): void {
    if (user.role === Role.ADMIN) return

    if (module.teacherId === user.id && user.role === Role.TEACHER) return

    throw new BusinessException(
      'Solo el profesor propietario puede modificar objetos de aprendizaje en este módulo',
      HttpStatus.FORBIDDEN,
    )
  },

  assertAnonymousLoReadAccess(
    module: { isPublic: boolean },
    lo: { isPublished: boolean },
  ): void {
    if (!lo.isPublished || !module.isPublic) {
      throw new BusinessException(
        'Este contenido no está disponible',
        HttpStatus.FORBIDDEN,
      )
    }
  },
}
