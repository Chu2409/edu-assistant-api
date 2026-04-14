import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common'
import { InjectQueue } from '@nestjs/bullmq'
import { Queue } from 'bullmq'
import { DBService } from 'src/core/database/database.service'
import { QUEUE_NAMES } from 'src/shared/constants/queues'
import { CreateLoDto } from './dtos/req/create-lo.dto'
import { UpdateLoDto } from './dtos/req/update-lo.dto'
import { UpdateLoContentDto } from './dtos/req/update-lo-content.dto'
import { ReorderLoDto } from './dtos/req/reorder-lo.dto'
import { LoDto } from './dtos/res/lo.dto'
import {
  Enrollment,
  Prisma,
  Role,
  type User,
} from 'src/core/database/generated/client'
import { LoFiltersDto } from './dtos/req/lo-filters.dto'
import { LoMapper } from './mappers/lo.mapper'
import { ApiPaginatedRes } from 'src/shared/dtos/res/api-response.dto'
import { FullLoDto } from './dtos/res/full-lo.dto'

@Injectable()
export class LoService {
  constructor(
    private readonly dbService: DBService,
    @InjectQueue(QUEUE_NAMES.EMBEDDINGS.NAME)
    private readonly embeddingsQueue: Queue,
  ) {}

  async create(dto: CreateLoDto, user: User): Promise<LoDto> {
    // Verificar que el módulo existe
    const module = await this.dbService.module.findUnique({
      where: { id: dto.moduleId },
      include: { aiConfiguration: true },
    })

    if (!module) {
      throw new NotFoundException(`Módulo con ID ${dto.moduleId} no encontrado`)
    }
    // Solo el profesor propietario puede crear objetos de aprendizaje
    if (module.teacherId !== user.id) {
      throw new ForbiddenException(
        'Solo el profesor propietario puede crear objetos de aprendizaje en este módulo',
      )
    }

    const lastLo = await this.dbService.learningObject.findFirst({
      where: { moduleId: dto.moduleId },
      orderBy: { orderIndex: 'desc' },
    })

    const lo = await this.dbService.learningObject.create({
      data: {
        typeId: dto.typeId,
        moduleId: dto.moduleId,
        title: dto.title,
        isPublished: dto.isPublished ?? false,
        orderIndex: lastLo?.orderIndex ? lastLo.orderIndex + 1 : 1,
      },
      include: { type: true },
    })

    return LoMapper.mapToDto(lo)
  }

  async findAll(
    moduleId: number,
    params: LoFiltersDto,
    user: User,
  ): Promise<ApiPaginatedRes<LoDto>> {
    // Verificar que el módulo existe
    const module = await this.dbService.module.findUnique({
      where: { id: moduleId },
      include: {
        enrollments: true,
      },
    })

    if (!module) {
      throw new NotFoundException(`Módulo con ID ${moduleId} no encontrado`)
    }

    // Verificar permisos: solo el profesor, módulos públicos o estudiantes inscritos
    if (
      module.teacherId !== user.id &&
      !module.isPublic &&
      !module.enrollments.some((enrollment) => enrollment.userId === user.id)
    ) {
      throw new ForbiddenException(
        'No tienes permisos para ver los objetos de aprendizaje de este módulo',
      )
    }

    // Construir filtro de búsqueda
    const where: Prisma.LearningObjectWhereInput = {
      moduleId,
    }

    if (params.typeId) {
      where.typeId = params.typeId
    }

    if (params.search) {
      where.OR = [{ title: { contains: params.search, mode: 'insensitive' } }]
    }

    // Si es estudiante, solo mostrar objetos de aprendizaje publicados
    if (user.role === Role.STUDENT && module.teacherId !== user.id) {
      where.isPublished = true
    }

    const [entities, total] = await Promise.all([
      this.dbService.learningObject.findMany({
        where,
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        orderBy: {
          orderIndex: 'asc',
        },
        include: { type: true },
      }),
      this.dbService.learningObject.count({
        where,
      }),
    ])

    return {
      records: entities.map((entity) => LoMapper.mapToDto(entity)),
      total,
      limit: params.limit,
      page: params.page,
      pages: Math.ceil(total / params.limit),
    }
  }

  private async findOneToTeacher(id: number, user: User) {
    const lo = await this.dbService.learningObject.findUnique({
      where: { id },
      include: {
        type: true,
        loFeedbacks: {
          include: {
            user: true,
          },
        },
        module: true,
        studentQuestions: {
          include: {
            user: true,
            replies: {
              include: {
                user: true,
              },
            },
          },
        },
        blocks: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    })

    if (!lo) {
      throw new NotFoundException(
        `Objeto de aprendizaje con ID ${id} no encontrado`,
      )
    }

    if (lo.module.teacherId !== user.id) {
      throw new ForbiddenException(
        'No tienes permisos para ver este objeto de aprendizaje',
      )
    }

    return lo
  }

  private async findOneToStudent(id: number, user: User) {
    const lo = await this.dbService.learningObject.findUnique({
      where: { id },
      include: {
        type: true,
        module: {
          include: {
            enrollments: true,
          },
        },
        studentQuestions: {
          include: {
            user: true,
            replies: {
              include: {
                user: true,
              },
            },
          },
          where: {
            OR: [{ isPublic: true }, { userId: user.id }],
          },
        },
        notes: {
          where: {
            userId: user.id,
          },
        },
        blocks: {
          orderBy: { orderIndex: 'asc' },
        },
        sessions: {
          where: { userId: user.id },
          take: 1,
        },
      },
    })

    if (!lo) {
      throw new NotFoundException(
        `Objeto de aprendizaje con ID ${id} no encontrado`,
      )
    }

    if (
      !lo.module.isPublic &&
      !lo.module.enrollments.some(
        (enrollment: Enrollment) =>
          enrollment.userId === user.id && enrollment.isActive,
      )
    ) {
      throw new ForbiddenException(
        'No tienes permisos para ver este objeto de aprendizaje',
      )
    }

    if (!lo.isPublished) {
      throw new ForbiddenException(
        'Este objeto de aprendizaje no está publicado aún',
      )
    }

    return lo
  }

  async findOne(id: number, user: User): Promise<FullLoDto> {
    let lo
    let isStudentView = false

    if (user.role === Role.STUDENT) {
      lo = await this.findOneToStudent(id, user)
      isStudentView = true
    } else {
      lo = await this.findOneToTeacher(id, user)
    }

    const previousLo = await this.dbService.learningObject.findFirst({
      where: {
        moduleId: lo.moduleId,
        orderIndex: { lt: lo.orderIndex },
        ...(isStudentView ? { isPublished: true } : {}),
      },
      orderBy: { orderIndex: 'desc' },
      select: { id: true },
    })

    const nextLo = await this.dbService.learningObject.findFirst({
      where: {
        moduleId: lo.moduleId,
        orderIndex: { gt: lo.orderIndex },
        ...(isStudentView ? { isPublished: true } : {}),
      },
      orderBy: { orderIndex: 'asc' },
      select: { id: true },
    })

    return LoMapper.mapToFullLoDto(
      lo,
      previousLo?.id ?? null,
      nextLo?.id ?? null,
    )
  }

  async update(
    id: number,
    updateLoDto: UpdateLoDto,
    user: User,
  ): Promise<LoDto> {
    // Verificar que el objeto de aprendizaje existe
    const existingLo = await this.dbService.learningObject.findUnique({
      where: { id },
      include: {
        module: true,
      },
    })

    if (!existingLo) {
      throw new NotFoundException(
        `Objeto de aprendizaje con ID ${id} no encontrado`,
      )
    }

    // Solo el profesor propietario puede actualizar objetos de aprendizaje
    if (existingLo.module.teacherId !== user.id) {
      throw new ForbiddenException(
        'Solo el profesor propietario puede actualizar este objeto de aprendizaje',
      )
    }

    const lo = await this.dbService.learningObject.update({
      where: { id },
      data: {
        ...(updateLoDto.title !== undefined && {
          title: updateLoDto.title,
        }),
        ...(updateLoDto.isPublished !== undefined && {
          isPublished: updateLoDto.isPublished,
        }),
        ...(updateLoDto.hasManualEdits !== undefined && {
          hasManualEdits: updateLoDto.hasManualEdits,
          conceptsProcessed: updateLoDto.hasManualEdits ? false : undefined,
        }),
        ...(updateLoDto.keywords !== undefined && {
          keywords: updateLoDto.keywords,
        }),
        ...(updateLoDto.typeId !== undefined && {
          typeId: updateLoDto.typeId,
        }),
      },
      include: { type: true },
    })

    // Al publicar el objeto de aprendizaje, encolar procesamiento de embeddings
    if (updateLoDto.isPublished === true) {
      await this.embeddingsQueue.add(
        QUEUE_NAMES.EMBEDDINGS.JOBS.PROCESS_LO,
        { learningObjectId: id },
        { removeOnComplete: true },
      )
    }

    return LoMapper.mapToDto(lo)
  }

  async updateContent(
    id: number,
    updateLoContentDto: UpdateLoContentDto,
    user: User,
  ): Promise<LoDto> {
    // Verificar que el objeto de aprendizaje existe
    const existingLo = await this.dbService.learningObject.findUnique({
      where: { id },
      include: {
        module: true,
        blocks: true,
      },
    })

    if (!existingLo) {
      throw new NotFoundException(
        `Objeto de aprendizaje con ID ${id} no encontrado`,
      )
    }

    // Solo el profesor propietario puede actualizar el contenido
    if (existingLo.module.teacherId !== user.id) {
      throw new ForbiddenException(
        'Solo el profesor propietario puede actualizar el contenido de este objeto de aprendizaje',
      )
    }

    // Ejecutar actualización de bloques en una transacción
    await this.dbService.$transaction(async (prisma) => {
      // Obtener los IDs de los bloques que se van a mantener/actualizar
      const blockIdsToKeep = updateLoContentDto.blocks
        .filter((block) => block.id !== undefined)
        .map((block) => block.id!)

      // Eliminar bloques que no están en la lista
      await prisma.block.deleteMany({
        where: {
          learningObjectId: id,
          id: {
            notIn: blockIdsToKeep.length > 0 ? blockIdsToKeep : [-1],
          },
        },
      })

      // Actualizar o crear bloques
      for (let index = 0; index < updateLoContentDto.blocks.length; index++) {
        const blockDto = updateLoContentDto.blocks[index]
        // El orden del array es la fuente de verdad; orderIndex es 0-based
        const orderIndex = index

        if (blockDto.id) {
          // Actualizar bloque existente
          await prisma.block.update({
            where: { id: blockDto.id },
            data: {
              type: blockDto.type,
              content: blockDto.content,
              tipTapContent: blockDto.tipTapContent,
              orderIndex,
            },
          })
        } else {
          // Crear nuevo bloque
          await prisma.block.create({
            data: {
              learningObjectId: id,
              type: blockDto.type,
              content: blockDto.content,
              tipTapContent: blockDto.tipTapContent,
              orderIndex,
            },
          })
        }
      }

      // Marcar el objeto de aprendizaje como editado manualmente
      await prisma.learningObject.update({
        where: { id },
        data: {
          hasManualEdits: true,
          conceptsProcessed: false,
        },
      })
    })

    // Obtener y retornar el objeto de aprendizaje actualizado
    const updatedLo = await this.dbService.learningObject.findUnique({
      where: { id },
      include: { type: true },
    })

    return LoMapper.mapToDto(updatedLo!)
  }

  async reorder(dto: ReorderLoDto, user: User): Promise<void> {
    const lo = await this.dbService.learningObject.findUnique({
      where: { id: dto.id },
      include: { module: true },
    })

    if (!lo) {
      throw new NotFoundException(
        `Objeto de aprendizaje con ID ${dto.id} no encontrado`,
      )
    }

    if (lo.module.teacherId !== user.id) {
      throw new ForbiddenException(
        'Solo el profesor propietario puede reordenar objetos de aprendizaje en este módulo',
      )
    }

    const oldIndex = lo.orderIndex
    const newIndex = dto.orderIndex

    if (oldIndex === newIndex) {
      return
    }

    const totalLos = await this.dbService.learningObject.count({
      where: { moduleId: lo.moduleId },
    })

    if (newIndex < 1 || newIndex > totalLos) {
      throw new BadRequestException(
        `El nuevo índice ${newIndex} está fuera de los límites [1, ${totalLos}]`,
      )
    }

    await this.dbService.$transaction(async (prisma) => {
      await prisma.learningObject.update({
        where: { id: lo.id },
        data: { orderIndex: -1 },
      })

      if (newIndex < oldIndex) {
        await prisma.learningObject.updateMany({
          where: {
            moduleId: lo.moduleId,
            orderIndex: { gte: newIndex, lt: oldIndex },
          },
          data: { orderIndex: { increment: 1 } },
        })
      } else {
        await prisma.learningObject.updateMany({
          where: {
            moduleId: lo.moduleId,
            orderIndex: { gt: oldIndex, lte: newIndex },
          },
          data: { orderIndex: { decrement: 1 } },
        })
      }

      await prisma.learningObject.update({
        where: { id: lo.id },
        data: { orderIndex: newIndex },
      })
    })
  }
}
