import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common'
import { DBService } from 'src/core/database/database.service'
import { CreatePageDto } from './dtos/req/create-page.dto'
import { UpdatePageDto } from './dtos/req/update-page.dto'
import { UpdatePageContentDto } from './dtos/req/update-page-content.dto'
import { ReorderPagesDto } from './dtos/req/reorder-pages.dto'
import { PageDto } from './dtos/res/page.dto'
import {
  Enrollment,
  Prisma,
  Role,
  type User,
} from 'src/core/database/generated/client'
import { BaseParamsReqDto } from 'src/shared/dtos/req/base-params.dto'
import { PagesMapper } from './mappers/pages.mapper'
import { ApiPaginatedRes } from 'src/shared/dtos/res/api-response.dto'
import { FullPageDto } from './dtos/res/full-page.dto'
import { ContentGenerationService } from '../content-generation/content-generation.service'
import { QUEUE_NAMES } from 'src/shared/constants/queues'
import { Queue } from 'bullmq'
import { InjectQueue } from '@nestjs/bullmq'

@Injectable()
export class PagesService {
  constructor(
    private readonly dbService: DBService,
    private readonly contentGenerationService: ContentGenerationService,
    @InjectQueue(QUEUE_NAMES.CONCEPTS.NAME)
    private readonly conceptsProcessorQueue: Queue,
  ) {}

  async create(dto: CreatePageDto, user: User): Promise<PageDto> {
    // Verificar que el módulo existe
    const module = await this.dbService.module.findUnique({
      where: { id: dto.moduleId },
      include: { aiConfiguration: true },
    })

    if (!module) {
      throw new NotFoundException(`Módulo con ID ${dto.moduleId} no encontrado`)
    }
    // Solo el profesor propietario puede crear páginas
    if (module.teacherId !== user.id) {
      throw new ForbiddenException(
        'Solo el profesor propietario puede crear páginas en este módulo',
      )
    }

    const lastPage = await this.dbService.page.findFirst({
      where: { moduleId: dto.moduleId },
      orderBy: { orderIndex: 'desc' },
    })

    const page = await this.dbService.page.create({
      data: {
        moduleId: dto.moduleId,
        title: dto.title,
        isPublished: dto.isPublished ?? false,
        orderIndex: lastPage?.orderIndex ? lastPage.orderIndex + 1 : 1,
      },
    })

    return PagesMapper.mapToDto(page)
  }

  async findAll(
    moduleId: number,
    params: BaseParamsReqDto,
    user: User,
  ): Promise<ApiPaginatedRes<PageDto>> {
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
        'No tienes permisos para ver las páginas de este módulo',
      )
    }

    // Construir filtro de búsqueda
    const where: Prisma.PageWhereInput = {
      moduleId,
    }

    if (params.search) {
      where.OR = [{ title: { contains: params.search, mode: 'insensitive' } }]
    }

    // Si es estudiante, solo mostrar páginas publicadas
    if (user.role === Role.STUDENT && module.teacherId !== user.id) {
      where.isPublished = true
    }

    const [entities, total] = await Promise.all([
      this.dbService.page.findMany({
        where,
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        orderBy: {
          orderIndex: 'asc',
        },
      }),
      this.dbService.page.count({
        where,
      }),
    ])

    return {
      records: entities.map((entity) => PagesMapper.mapToDto(entity)),
      total,
      limit: params.limit,
      page: params.page,
      pages: Math.ceil(total / params.limit),
    }
  }

  private async findOneToTeacher(id: number, user: User) {
    const page = await this.dbService.page.findUnique({
      where: { id },
      include: {
        pageFeedbacks: {
          include: {
            user: true,
          },
        },
        module: true,
        studentQuestions: {
          include: {
            user: true,
          },
        },
        blocks: true,
      },
    })

    if (!page) {
      throw new NotFoundException(`Página con ID ${id} no encontrada`)
    }

    if (page.module.teacherId !== user.id) {
      throw new ForbiddenException('No tienes permisos para ver esta página')
    }

    return page
  }

  private async findOneToStudent(id: number, user: User) {
    const page = await this.dbService.page.findUnique({
      where: { id },
      include: {
        module: {
          include: {
            enrollments: true,
          },
        },
        studentQuestions: {
          include: {
            user: true,
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
        blocks: true,
      },
    })

    if (!page) {
      throw new NotFoundException(`Página con ID ${id} no encontrada`)
    }

    if (
      !page.module.isPublic &&
      !page.module.enrollments.some(
        (enrollment: Enrollment) =>
          enrollment.userId === user.id && enrollment.isActive,
      )
    ) {
      throw new ForbiddenException('No tienes permisos para ver esta página')
    }

    if (!page.isPublished) {
      throw new ForbiddenException('Esta página no está publicada aún')
    }

    return page
  }

  async findOne(id: number, user: User): Promise<FullPageDto> {
    if (user.role === Role.STUDENT) {
      const page = await this.findOneToStudent(id, user)
      return PagesMapper.mapToFullPageDto(page)
    }

    const page = await this.findOneToTeacher(id, user)
    return PagesMapper.mapToFullPageDto(page)
  }

  async update(
    id: number,
    updatePageDto: UpdatePageDto,
    user: User,
  ): Promise<PageDto> {
    // Verificar que la página existe
    const existingPage = await this.dbService.page.findUnique({
      where: { id },
      include: {
        module: true,
      },
    })

    if (!existingPage) {
      throw new NotFoundException(`Página con ID ${id} no encontrada`)
    }

    // Solo el profesor propietario puede actualizar páginas
    if (existingPage.module.teacherId !== user.id) {
      throw new ForbiddenException(
        'Solo el profesor propietario puede actualizar esta página',
      )
    }

    const page = await this.dbService.page.update({
      where: { id },
      data: {
        ...(updatePageDto.title !== undefined && {
          title: updatePageDto.title,
        }),
        ...(updatePageDto.isPublished !== undefined && {
          isPublished: updatePageDto.isPublished,
        }),
      },
    })

    if (updatePageDto.hasManualEdits) {
      await this.conceptsProcessorQueue.add(QUEUE_NAMES.CONCEPTS.JOBS.PROCESS, {
        pageId: page.id,
      })
    }

    return PagesMapper.mapToDto(page)
  }

  async updateContent(
    id: number,
    updatePageContentDto: UpdatePageContentDto,
    user: User,
  ): Promise<PageDto> {
    // Verificar que la página existe
    const existingPage = await this.dbService.page.findUnique({
      where: { id },
      include: {
        module: true,
        blocks: true,
      },
    })

    if (!existingPage) {
      throw new NotFoundException(`Página con ID ${id} no encontrada`)
    }

    // Solo el profesor propietario puede actualizar el contenido
    if (existingPage.module.teacherId !== user.id) {
      throw new ForbiddenException(
        'Solo el profesor propietario puede actualizar el contenido de esta página',
      )
    }

    // Ejecutar actualización de bloques en una transacción
    await this.dbService.$transaction(async (prisma) => {
      // Obtener los IDs de los bloques que se van a mantener/actualizar
      const blockIdsToKeep = updatePageContentDto.blocks
        .filter((block) => block.id !== undefined)
        .map((block) => block.id!)

      // Eliminar bloques que no están en la lista
      await prisma.block.deleteMany({
        where: {
          pageId: id,
          id: {
            notIn: blockIdsToKeep.length > 0 ? blockIdsToKeep : [-1],
          },
        },
      })

      // Actualizar o crear bloques
      for (const blockDto of updatePageContentDto.blocks) {
        if (blockDto.id) {
          // Actualizar bloque existente
          await prisma.block.update({
            where: { id: blockDto.id },
            data: {
              type: blockDto.type,
              content: blockDto.content,
              ...(blockDto.tipTapContent !== undefined && {
                tipTapContent:
                  blockDto.tipTapContent === null
                    ? Prisma.JsonNull
                    : blockDto.tipTapContent,
              }),
            },
          })
        } else {
          // Crear nuevo bloque
          await prisma.block.create({
            data: {
              pageId: id,
              type: blockDto.type,
              content: blockDto.content,
              ...(blockDto.tipTapContent !== undefined && {
                tipTapContent:
                  blockDto.tipTapContent === null
                    ? Prisma.JsonNull
                    : blockDto.tipTapContent,
              }),
            },
          })
        }
      }

      // Marcar la página como editada manualmente
      await prisma.page.update({
        where: { id },
        data: {
          hasManualEdits: true,
        },
      })
    })

    // Encolar procesamiento de conceptos
    await this.conceptsProcessorQueue.add(QUEUE_NAMES.CONCEPTS.JOBS.PROCESS, {
      pageId: id,
    })

    // Obtener y retornar la página actualizada
    const updatedPage = await this.dbService.page.findUnique({
      where: { id },
    })

    return PagesMapper.mapToDto(updatedPage!)
  }

  async reorder(reorderPagesDto: ReorderPagesDto, user: User): Promise<void> {
    if (reorderPagesDto.pages.length === 0) {
      return
    }

    // Validar que los índices de orden sean únicos
    const orderIndices = reorderPagesDto.pages.map((p) => p.orderIndex)
    const uniqueOrderIndices = new Set(orderIndices)
    if (orderIndices.length !== uniqueOrderIndices.size) {
      const duplicates = orderIndices.filter(
        (index, i) => orderIndices.indexOf(index) !== i,
      )
      throw new ForbiddenException(
        `Los índices de orden deben ser únicos. Índices duplicados: ${[...new Set(duplicates)].join(', ')}`,
      )
    }

    // Obtener todas las páginas a actualizar para verificar permisos
    const pageIds = reorderPagesDto.pages.map((p) => p.id)
    const pages = await this.dbService.page.findMany({
      where: {
        id: { in: pageIds },
      },
      include: {
        module: true,
      },
    })

    if (pages.length !== pageIds.length) {
      const foundIds = pages.map((p) => p.id)
      const missingIds = pageIds.filter((id) => !foundIds.includes(id))
      throw new NotFoundException(
        `Páginas con IDs ${missingIds.join(', ')} no encontradas`,
      )
    }

    // Verificar que todas las páginas pertenecen al mismo módulo
    const moduleIds = [...new Set(pages.map((p) => p.moduleId))]
    if (moduleIds.length > 1) {
      throw new ForbiddenException(
        'Todas las páginas deben pertenecer al mismo módulo',
      )
    }

    const module = pages[0].module

    // Solo el profesor propietario puede reordenar páginas
    if (module.teacherId !== user.id) {
      throw new ForbiddenException(
        'Solo el profesor propietario puede reordenar las páginas de este módulo',
      )
    }

    // Actualizar los orderIndex de todas las páginas en una transacción
    await this.dbService.$transaction(
      reorderPagesDto.pages.map((pageReorder) =>
        this.dbService.page.update({
          where: { id: pageReorder.id },
          data: { orderIndex: pageReorder.orderIndex },
        }),
      ),
    )
  }
}
