import {
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { BusinessException } from 'src/shared/exceptions/business.exception'
import { DBService } from 'src/core/database/database.service'
import { EmailService } from 'src/providers/email/email.service'
import { CreateEnrollmentDto } from './dtos/req/create-enrollment.dto'
import { UpdateEnrollmentDto } from './dtos/req/update-enrollment.dto'
import { BulkEnrollStudentsDto } from './dtos/req/bulk-enroll-students.dto'
import { EnrollmentDto } from './dtos/res/enrollment.dto'
import type { User } from 'src/core/database/generated/client'
import { EnrollmentsMapper } from './mappers/enrollments.mapper'
import { EnrollmentStudentsDto } from './dtos/res/enrollment-student.dto'

@Injectable()
export class EnrollmentsService {
  private readonly logger = new Logger(EnrollmentsService.name)

  constructor(
    private readonly dbService: DBService,
    private readonly emailService: EmailService,
  ) {}

  async selfEnroll(
    createEnrollmentDto: CreateEnrollmentDto,
    user: User,
  ): Promise<EnrollmentDto> {
    const module = await this.dbService.module.findUnique({
      where: { id: createEnrollmentDto.moduleId },
      include: { teacher: true },
    })

    if (!module) {
      throw new NotFoundException(
        `Módulo con ID ${createEnrollmentDto.moduleId} no encontrado`,
      )
    }

    if (!module.allowSelfEnroll) {
      throw new BusinessException(
        'Este módulo no permite auto-inscripción',
        HttpStatus.FORBIDDEN,
      )
    }

    if (!module.isActive) {
      throw new BusinessException(
        'El módulo no está activo',
        HttpStatus.BAD_REQUEST,
      )
    }

    const existingEnrollment = await this.dbService.enrollment.findUnique({
      where: {
        userId_moduleId: {
          userId: user.id,
          moduleId: createEnrollmentDto.moduleId,
        },
      },
    })

    let enrollment
    if (existingEnrollment) {
      if (existingEnrollment.isActive) {
        throw new BusinessException(
          'Ya estás inscrito en este módulo',
          HttpStatus.CONFLICT,
        )
      }
      enrollment = await this.dbService.enrollment.update({
        where: { id: existingEnrollment.id },
        data: {
          isActive: true,
          enrolledAt: new Date(),
          completedAt: null,
        },
      })
    } else {
      enrollment = await this.dbService.enrollment.create({
        data: {
          userId: user.id,
          moduleId: createEnrollmentDto.moduleId,
        },
      })
    }

    return EnrollmentsMapper.mapToDto(enrollment)
  }

  async bulkEnrollStudents(
    bulkEnrollDto: BulkEnrollStudentsDto,
    teacher: User,
  ): Promise<EnrollmentDto[]> {
    const module = await this.dbService.module.findUnique({
      where: { id: bulkEnrollDto.moduleId },
    })

    if (!module) {
      throw new NotFoundException(
        `Módulo con ID ${bulkEnrollDto.moduleId} no encontrado`,
      )
    }

    if (!module.isActive) {
      throw new BusinessException(
        'El módulo no está activo',
        HttpStatus.BAD_REQUEST,
      )
    }

    if (module.teacherId !== teacher.id) {
      throw new BusinessException(
        'Solo el profesor propietario puede inscribir estudiantes',
        HttpStatus.FORBIDDEN,
      )
    }

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
      throw new BusinessException(
        'Solo el profesor propietario puede ver las inscripciones',
        HttpStatus.FORBIDDEN,
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
      throw new BusinessException(
        'Solo el profesor propietario puede actualizar inscripciones',
        HttpStatus.FORBIDDEN,
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
      throw new BusinessException(
        'No estás inscrito en este módulo',
        HttpStatus.NOT_FOUND,
      )
    }

    if (!enrollment.isActive) {
      throw new BusinessException(
        'Ya estás desinscrito de este módulo',
        HttpStatus.BAD_REQUEST,
      )
    }

    if (!enrollment.module.allowSelfUnenroll) {
      throw new BusinessException(
        'Este módulo no permite auto-desinscripción',
        HttpStatus.FORBIDDEN,
      )
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
      throw new BusinessException(
        'Solo el profesor propietario puede eliminar inscripciones',
        HttpStatus.FORBIDDEN,
      )
    }

    await this.dbService.enrollment.delete({
      where: { id },
    })

    return EnrollmentsMapper.mapToDto(enrollment)
  }

  async sendDailySummaries(): Promise<void> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const newEnrollments = await this.dbService.enrollment.findMany({
      where: {
        enrolledAt: {
          gte: today,
          lt: tomorrow,
        },
        isActive: true,
      },
      include: {
        user: {
          select: { name: true, email: true },
        },
        module: {
          include: {
            teacher: {
              select: { email: true },
            },
          },
        },
      },
    })

    if (newEnrollments.length === 0) {
      return
    }

    const groupedByModule = newEnrollments.reduce(
      (acc, enrollment) => {
        const moduleId = enrollment.moduleId
        if (!acc[moduleId]) {
          acc[moduleId] = {
            moduleTitle: enrollment.module.title,
            teacherEmail: enrollment.module.teacher.email,
            students: [],
          }
        }

        acc[moduleId].students.push({
          name: enrollment.user.name || enrollment.user.email,
          date: enrollment.enrolledAt.toLocaleTimeString('es-AR', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        })

        return acc
      },
      {} as Record<
        number,
        {
          moduleTitle: string
          teacherEmail: string
          students: { name: string; date: string }[]
        }
      >,
    )

    for (const data of Object.values(groupedByModule)) {
      if (data.teacherEmail && data.students.length > 0) {
        try {
          await this.emailService.sendWithTemplate(
            data.teacherEmail,
            `Resumen diario: ${data.students.length} nuevas inscripciones en ${data.moduleTitle}`,
            'teacher-daily-enrollments',
            {
              moduleTitle: data.moduleTitle,
              students: data.students,
              dashboardUrl: `${process.env.FRONTEND_URL || 'https://tu-app.com'}`,
            },
          )
        } catch (error) {
          this.logger.error(
            `Error enviando resumen a ${data.teacherEmail}: ${error}`,
          )
        }
      }
    }
  }
}
