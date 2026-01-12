import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common'
import { DBService } from 'src/core/database/database.service'
import { CreatePageDto } from './dtos/req/create-page.dto'
import { UpdatePageDto } from './dtos/req/update-page.dto'
import { PageDto } from './dtos/res/page.dto'
import {
  Role,
  type Prisma,
  type User,
} from 'src/core/database/generated/client'
import { BaseParamsReqDto } from 'src/shared/dtos/req/base-params.dto'
import { PagesMapper } from './mappers/pages.mapper'
import { ApiPaginatedRes } from 'src/shared/dtos/res/api-response.dto'

@Injectable()
export class PagesService {
  constructor(private readonly dbService: DBService) {}

  async create(createPageDto: CreatePageDto, user: User): Promise<PageDto> {
    // Verificar que el módulo existe
    const module = await this.dbService.module.findUnique({
      where: { id: createPageDto.moduleId },
    })

    if (!module) {
      throw new NotFoundException(
        `Módulo con ID ${createPageDto.moduleId} no encontrado`,
      )
    }

    // Solo el profesor propietario puede crear páginas
    if (module.teacherId !== user.id) {
      throw new ForbiddenException(
        'Solo el profesor propietario puede crear páginas en este módulo',
      )
    }

    // Verificar que no existe otra página con el mismo orderIndex en el módulo
    const existingPage = await this.dbService.page.findUnique({
      where: {
        moduleId_orderIndex: {
          moduleId: createPageDto.moduleId,
          orderIndex: createPageDto.orderIndex,
        },
      },
    })

    if (existingPage) {
      throw new ConflictException(
        `Ya existe una página con el índice de orden ${createPageDto.orderIndex} en este módulo`,
      )
    }

    const page = await this.dbService.page.create({
      data: {
        moduleId: createPageDto.moduleId,
        title: createPageDto.title,
        content: createPageDto.content,
        rawContent: createPageDto.rawContent,
        orderIndex: createPageDto.orderIndex,
        keywords: createPageDto.keywords ?? [],
        isPublished: createPageDto.isPublished ?? false,
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
      where.OR = [
        { title: { contains: params.search, mode: 'insensitive' } },
        { content: { contains: params.search, mode: 'insensitive' } },
      ]
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

  async findOne(id: number, user: User): Promise<PageDto> {
    const page = await this.dbService.page.findUnique({
      where: { id },
      include: {
        module: {
          include: {
            enrollments: true,
          },
        },
      },
    })

    if (!page) {
      throw new NotFoundException(`Página con ID ${id} no encontrada`)
    }

    // Verificar permisos: solo el profesor, módulos públicos o estudiantes inscritos
    if (
      page.module.teacherId !== user.id &&
      !page.module.isPublic &&
      !page.module.enrollments.some(
        (enrollment) => enrollment.userId === user.id,
      )
    ) {
      throw new ForbiddenException('No tienes permisos para ver esta página')
    }

    // Si es estudiante y la página no está publicada, solo el profesor puede verla
    if (
      user.role === Role.STUDENT &&
      !page.isPublished &&
      page.module.teacherId !== user.id
    ) {
      throw new ForbiddenException('Esta página no está publicada aún')
    }

    return PagesMapper.mapToDto(page)
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

    // Si se está actualizando el orderIndex, verificar que no existe conflicto
    if (
      updatePageDto.orderIndex !== undefined &&
      updatePageDto.orderIndex !== existingPage.orderIndex
    ) {
      const conflictingPage = await this.dbService.page.findUnique({
        where: {
          moduleId_orderIndex: {
            moduleId: existingPage.moduleId,
            orderIndex: updatePageDto.orderIndex,
          },
        },
      })

      if (conflictingPage && conflictingPage.id !== id) {
        throw new ConflictException(
          `Ya existe una página con el índice de orden ${updatePageDto.orderIndex} en este módulo`,
        )
      }
    }

    const page = await this.dbService.page.update({
      where: { id },
      data: {
        ...(updatePageDto.title !== undefined && {
          title: updatePageDto.title,
        }),
        ...(updatePageDto.content !== undefined && {
          content: updatePageDto.content,
        }),
        ...(updatePageDto.rawContent !== undefined && {
          rawContent: updatePageDto.rawContent,
        }),
        ...(updatePageDto.orderIndex !== undefined && {
          orderIndex: updatePageDto.orderIndex,
        }),
        ...(updatePageDto.keywords !== undefined && {
          keywords: updatePageDto.keywords,
        }),
        ...(updatePageDto.isPublished !== undefined && {
          isPublished: updatePageDto.isPublished,
        }),
      },
    })

    return PagesMapper.mapToDto(page)
  }

  async remove(id: number, user: User): Promise<void> {
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

    // Solo el profesor propietario puede eliminar páginas
    if (existingPage.module.teacherId !== user.id) {
      throw new ForbiddenException(
        'Solo el profesor propietario puede eliminar esta página',
      )
    }

    await this.dbService.page.delete({
      where: { id },
    })
  }
}
