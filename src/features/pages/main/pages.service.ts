import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common'
import { DBService } from 'src/core/database/database.service'
import { CreatePageDto } from './dtos/req/create-page.dto'
import { UpdatePageDto } from './dtos/req/update-page.dto'
import { PageDto } from './dtos/res/page.dto'
import {
  Enrollment,
  Role,
  type Prisma,
  type User,
} from 'src/core/database/generated/client'
import { BaseParamsReqDto } from 'src/shared/dtos/req/base-params.dto'
import { PagesMapper } from './mappers/pages.mapper'
import { ApiPaginatedRes } from 'src/shared/dtos/res/api-response.dto'
import { FullPageDto } from './dtos/res/full-page.dto'

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

    if (!module.isActive) {
      throw new ForbiddenException('El módulo no está activo')
    }

    const lastPage = await this.dbService.page.findFirst({
      where: { moduleId: createPageDto.moduleId },
      orderBy: { orderIndex: 'desc' },
    })

    const page = await this.dbService.page.create({
      data: {
        moduleId: createPageDto.moduleId,
        title: createPageDto.title,
        content: createPageDto.content,
        rawContent: createPageDto.rawContent,
        keywords: createPageDto.keywords ?? [],
        isPublished: createPageDto.isPublished ?? false,
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
      },
    })

    if (!page) {
      throw new NotFoundException(`Página con ID ${id} no encontrada`)
    }

    if (
      !page.module.isPublic &&
      !page.module.enrollments.some(
        (enrollment: Enrollment) => enrollment.userId === user.id,
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
        ...(updatePageDto.content !== undefined && {
          content: updatePageDto.content,
        }),
        ...(updatePageDto.rawContent !== undefined && {
          rawContent: updatePageDto.rawContent,
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
}
