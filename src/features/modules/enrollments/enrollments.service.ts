import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common'
import { DBService } from 'src/core/database/database.service'
import { CreateEnrollmentDto } from './dtos/req/create-enrollment.dto'
import { UpdateEnrollmentDto } from './dtos/req/update-enrollment.dto'
import { BulkEnrollStudentsDto } from './dtos/req/bulk-enroll-students.dto'
import { EnrollmentDto } from './dtos/res/enrollment.dto'
import type { User } from 'src/core/database/generated/client'
import { EnrollmentsMapper } from './mappers/enrollments.mapper'
import { EnrollmentStudentsDto } from './dtos/res/enrollment-student.dto'

@Injectable()
export class EnrollmentsService {
  constructor(private readonly dbService: DBService) {}

  async selfEnroll(
    createEnrollmentDto: CreateEnrollmentDto,
    user: User,
  ): Promise<EnrollmentDto> {
    // Verificar que el módulo existe
    const module = await this.dbService.module.findUnique({
      where: { id: createEnrollmentDto.moduleId },
    })

    if (!module) {
      throw new NotFoundException(
        `Módulo con ID ${createEnrollmentDto.moduleId} no encontrado`,
      )
    }

    // Verificar que el módulo permite auto-inscripción
    if (!module.allowSelfEnroll) {
      throw new ForbiddenException('Este módulo no permite auto-inscripción')
    }

    // Verificar que el módulo está activo
    if (!module.isActive) {
      throw new BadRequestException('El módulo no está activo')
    }

    // Verificar que no esté ya inscrito
    const existingEnrollment = await this.dbService.enrollment.findUnique({
      where: {
        userId_moduleId: {
          userId: user.id,
          moduleId: createEnrollmentDto.moduleId,
        },
      },
    })

    if (existingEnrollment) {
      if (existingEnrollment.isActive) {
        throw new ConflictException('Ya estás inscrito en este módulo')
      }
      // Si existe pero está inactiva, reactivarla
      const enrollment = await this.dbService.enrollment.update({
        where: { id: existingEnrollment.id },
        data: {
          isActive: true,
          enrolledAt: new Date(),
          completedAt: null,
        },
      })
      return EnrollmentsMapper.mapToDto(enrollment)
    }

    // Crear nueva inscripción
    const enrollment = await this.dbService.enrollment.create({
      data: {
        userId: user.id,
        moduleId: createEnrollmentDto.moduleId,
      },
    })

    // TODO: Enviar notificación al profesor

    return EnrollmentsMapper.mapToDto(enrollment)
  }

  async bulkEnrollStudents(
    bulkEnrollDto: BulkEnrollStudentsDto,
    teacher: User,
  ): Promise<EnrollmentDto[]> {
    // Verificar que el módulo existe y pertenece al profesor
    const module = await this.dbService.module.findUnique({
      where: { id: bulkEnrollDto.moduleId },
    })

    if (!module) {
      throw new NotFoundException(
        `Módulo con ID ${bulkEnrollDto.moduleId} no encontrado`,
      )
    }

    if (!module.isActive) {
      throw new BadRequestException('El módulo no está activo')
    }

    if (module.teacherId !== teacher.id) {
      throw new ForbiddenException(
        'Solo el profesor propietario puede inscribir estudiantes',
      )
    }

    // Verificar que los estudiantes existen
    const students = await this.dbService.user.findMany({
      where: {
        id: {
          in: bulkEnrollDto.studentIds,
        },
      },
    })

    if (students.length !== bulkEnrollDto.studentIds.length) {
      throw new NotFoundException('Uno o más estudiantes no fueron encontrados')
    }

    const existingEnrollments = await this.dbService.enrollment.findMany({
      where: {
        moduleId: bulkEnrollDto.moduleId,
        userId: {
          in: bulkEnrollDto.studentIds,
        },
      },
    })

    const existingUserIds = new Set(existingEnrollments.map((e) => e.userId))
    const newStudentIds = bulkEnrollDto.studentIds.filter(
      (id) => !existingUserIds.has(id),
    )

    const enrollmentsToCreate = newStudentIds.map((userId) => ({
      userId,
      moduleId: bulkEnrollDto.moduleId,
    }))

    if (enrollmentsToCreate.length > 0) {
      await this.dbService.enrollment.createMany({
        data: enrollmentsToCreate,
        skipDuplicates: true,
      })
    }

    // Reactivar inscripciones inactivas si existen
    const inactiveEnrollments = existingEnrollments.filter((e) => !e.isActive)
    if (inactiveEnrollments.length > 0) {
      await this.dbService.enrollment.updateMany({
        where: {
          id: {
            in: inactiveEnrollments.map((e) => e.id),
          },
        },
        data: {
          isActive: true,
          enrolledAt: new Date(),
          completedAt: null,
        },
      })
    }

    // TODO: Enviar notificación a los estudiantes inscritos

    const allEnrollments = await this.dbService.enrollment.findMany({
      where: {
        moduleId: bulkEnrollDto.moduleId,
        userId: {
          in: bulkEnrollDto.studentIds,
        },
      },
    })

    return allEnrollments.map((enrollment) =>
      EnrollmentsMapper.mapToDto(enrollment),
    )
  }

  async findModuleEnrollments(
    moduleId: number,
    teacher: User,
  ): Promise<EnrollmentStudentsDto[]> {
    const module = await this.dbService.module.findUnique({
      where: { id: moduleId },
    })

    if (!module) {
      throw new NotFoundException(`Módulo con ID ${moduleId} no encontrado`)
    }

    if (module.teacherId !== teacher.id) {
      throw new ForbiddenException(
        'Solo el profesor propietario puede ver las inscripciones',
      )
    }

    const enrollments = await this.dbService.enrollment.findMany({
      where: {
        moduleId,
      },
      include: {
        user: true,
      },
      orderBy: {
        enrolledAt: 'desc',
      },
    })

    return enrollments.map((enrollment) =>
      EnrollmentsMapper.mapToEnrollmentStudentsDto(enrollment),
    )
  }

  async update(
    id: number,
    updateEnrollmentDto: UpdateEnrollmentDto,
    user: User,
  ): Promise<EnrollmentDto> {
    const enrollment = await this.dbService.enrollment.findUnique({
      where: { id },
      include: {
        module: true,
      },
    })

    if (!enrollment) {
      throw new NotFoundException(`Inscripción con ID ${id} no encontrada`)
    }

    if (enrollment.module.teacherId !== user.id) {
      throw new ForbiddenException(
        'Solo el profesor propietario puede actualizar inscripciones',
      )
    }

    const updatedEnrollment = await this.dbService.enrollment.update({
      where: { id },
      data: {
        isActive: updateEnrollmentDto.isActive,
        completedAt: updateEnrollmentDto.completedAt
          ? new Date(updateEnrollmentDto.completedAt)
          : undefined,
      },
    })

    return EnrollmentsMapper.mapToDto(updatedEnrollment)
  }

  async selfUnenroll(moduleId: number, user: User): Promise<EnrollmentDto> {
    const enrollment = await this.dbService.enrollment.findUnique({
      where: {
        userId_moduleId: {
          userId: user.id,
          moduleId,
        },
      },
      include: {
        module: true,
      },
    })

    if (!enrollment) {
      throw new NotFoundException('No estás inscrito en este módulo')
    }

    if (!enrollment.isActive) {
      throw new BadRequestException('Ya estás desinscrito de este módulo')
    }

    if (!enrollment.module.allowSelfUnenroll) {
      throw new ForbiddenException('Este módulo no permite auto-desinscripción')
    }

    await this.dbService.enrollment.delete({
      where: { id: enrollment.id },
    })

    return EnrollmentsMapper.mapToDto(enrollment)
  }

  async remove(id: number, teacher: User): Promise<EnrollmentDto> {
    const enrollment = await this.dbService.enrollment.findUnique({
      where: { id },
      include: {
        module: true,
      },
    })

    if (!enrollment) {
      throw new NotFoundException(`Inscripción con ID ${id} no encontrada`)
    }

    if (enrollment.module.teacherId !== teacher.id) {
      throw new ForbiddenException(
        'Solo el profesor propietario puede eliminar inscripciones',
      )
    }

    await this.dbService.enrollment.delete({
      where: { id },
    })

    return EnrollmentsMapper.mapToDto(enrollment)
  }
}
