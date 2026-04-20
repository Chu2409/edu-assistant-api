import { Injectable, HttpStatus, NotFoundException } from '@nestjs/common'
import { DBService } from 'src/core/database/database.service'
import { CreateModuleDto } from './dtos/req/create-module.dto'
import { UpdateModuleDto } from './dtos/req/update-module.dto'
import { ModuleDto } from './dtos/res/module.dto'
import {
  Role,
  type Prisma,
  type User,
} from 'src/core/database/generated/client'
import {
  AiTargetLevel,
  AiAudience,
  AiLength,
  AiTone,
} from 'src/core/database/generated/enums'
import {
  ModulesAllFiltersDto,
  ModulesAvailableFiltersDto,
} from './dtos/req/module-filters.dto'
import { ApiPaginatedRes } from 'src/shared/dtos/res/api-response.dto'
import { ModulesMapper } from './mappers/modules.mapper'
import { convertToFilterWhere } from 'src/shared/utils/converters'
import { BusinessException } from 'src/shared/exceptions/business.exception'

@Injectable()
export class ModulesService {
  constructor(private readonly dbService: DBService) {}

  private async validateUniqueTitle(
    title: string,
    excludeModuleId?: number,
  ): Promise<void> {
    const existingModule = await this.dbService.module.findFirst({
      where: {
        title: {
          equals: title,
          mode: 'insensitive',
        },
        ...(excludeModuleId && { id: { not: excludeModuleId } }),
      },
    })

    if (existingModule) {
      throw new BusinessException(
        `Ya existe un módulo con el título "${title}"`,
        HttpStatus.CONFLICT,
      )
    }
  }

  async create(
    createModuleDto: CreateModuleDto,
    user: User,
  ): Promise<ModuleDto> {
    await this.validateUniqueTitle(createModuleDto.title)

    const module = await this.dbService.module.create({
      data: {
        title: createModuleDto.title,
        description: createModuleDto.description,
        teacherId: user.id,
        isPublic: createModuleDto.isPublic ?? false,
        allowSelfEnroll: createModuleDto.allowSelfEnroll ?? true,
        logoUrl: createModuleDto.logoUrl,
        aiConfiguration: {
          create: {
            language: createModuleDto.aiConfiguration.language ?? 'es',
            targetLevel:
              createModuleDto.aiConfiguration.targetLevel ??
              AiTargetLevel.INTERMEDIATE,
            audience:
              createModuleDto.aiConfiguration.audience ?? AiAudience.UNIVERSITY,
            contentLength:
              createModuleDto.aiConfiguration.contentLength ?? AiLength.MEDIUM,
            tone: createModuleDto.aiConfiguration.tone ?? AiTone.EDUCATIONAL,
          },
        },
      },
      include: {
        aiConfiguration: true,
      },
    })

    return ModulesMapper.mapToDto(module)
  }

  async findAll(
    params: ModulesAllFiltersDto,
    user: User,
  ): Promise<ApiPaginatedRes<ModuleDto>> {
    const where: Prisma.ModuleWhereInput = {}

    if (user.role === Role.TEACHER) {
      where.teacherId = user.id
      where.isPublic = params.isPublic
    } else if (user.role === Role.STUDENT) {
      where.enrollments = {
        some: { userId: user.id, isActive: true },
      }
      where.isActive = true
      where.teacherId = { in: convertToFilterWhere(params.teacherId) }
    }

    if (params.search) {
      where.AND = {
        OR: [
          { title: { contains: params.search, mode: 'insensitive' } },
          { description: { contains: params.search, mode: 'insensitive' } },
        ],
      }
    }

    const [entities, total] = await Promise.all([
      this.dbService.module.findMany({
        where,
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          aiConfiguration: true,
        },
      }),
      this.dbService.module.count({
        where,
      }),
    ])

    return {
      records: entities.map((entity) => ModulesMapper.mapToDto(entity)),
      total,
      limit: params.limit,
      page: params.page,
      pages: Math.ceil(total / params.limit),
    }
  }

  async findModulesAvailable(
    params: ModulesAvailableFiltersDto,
    user: User,
  ): Promise<ApiPaginatedRes<ModuleDto>> {
    const where: Prisma.ModuleWhereInput = {}

    where.isPublic = true
    where.isActive = true
    where.teacherId = { in: convertToFilterWhere(params.teacherId) }
    where.enrollments = {
      none: { userId: user.id },
    }

    if (params.search) {
      where.AND = {
        OR: [
          { title: { contains: params.search, mode: 'insensitive' } },
          { description: { contains: params.search, mode: 'insensitive' } },
        ],
      }
    }

    const [entities, total] = await Promise.all([
      this.dbService.module.findMany({
        where,
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          aiConfiguration: true,
        },
      }),
      this.dbService.module.count({
        where,
      }),
    ])

    return {
      records: entities.map((entity) => ModulesMapper.mapToDto(entity)),
      total,
      limit: params.limit,
      page: params.page,
      pages: Math.ceil(total / params.limit),
    }
  }

  async findOne(id: number, user: User): Promise<ModuleDto> {
    const module = await this.dbService.module.findUnique({
      where: { id },
      include: {
        aiConfiguration: true,
        enrollments: true,
      },
    })

    if (!module) {
      throw new NotFoundException(`Módulo con ID ${id} no encontrado`)
    }

    if (!module.isActive && module.teacherId !== user.id) {
      throw new BusinessException(
        'No tienes permisos para acceder a este módulo',
        HttpStatus.FORBIDDEN,
      )
    }

    if (
      module.teacherId !== user.id &&
      !module.isPublic &&
      !module.enrollments.some((enrollment) => enrollment.userId === user.id)
    ) {
      throw new BusinessException(
        'No tienes permisos para acceder a este módulo',
        HttpStatus.FORBIDDEN,
      )
    }

    return ModulesMapper.mapToDto(module)
  }

  async update(
    id: number,
    updateModuleDto: UpdateModuleDto,
    user: User,
  ): Promise<ModuleDto> {
    const existingModule = await this.dbService.module.findUnique({
      where: { id },
      include: {
        aiConfiguration: true,
      },
    })

    if (!existingModule) {
      throw new NotFoundException(`Módulo con ID ${id} no encontrado`)
    }

    if (existingModule.teacherId !== user.id) {
      throw new BusinessException(
        'Solo el profesor propietario puede actualizar el módulo',
        HttpStatus.FORBIDDEN,
      )
    }

    if (updateModuleDto.title) {
      await this.validateUniqueTitle(updateModuleDto.title, id)
    }

    const { aiConfiguration, ...moduleData } = updateModuleDto

    const updateData: {
      title?: string
      description?: string
      isPublic?: boolean
      allowSelfEnroll?: boolean
      logoUrl?: string | null
      isActive?: boolean
      aiConfiguration?: {
        update?: {
          language?: string
          targetLevel?: AiTargetLevel
          audience?: AiAudience
          contentLength?: AiLength
          tone?: AiTone
        }
        create?: {
          language: string
          targetLevel: AiTargetLevel
          audience: AiAudience
          contentLength: AiLength
          tone: AiTone
        }
      }
    } = { ...moduleData }

    if (aiConfiguration !== undefined) {
      if (existingModule.aiConfiguration) {
        updateData.aiConfiguration = {
          update: {
            ...(aiConfiguration.language !== undefined && {
              language: aiConfiguration.language,
            }),
            ...(aiConfiguration.targetLevel !== undefined && {
              targetLevel: aiConfiguration.targetLevel,
            }),
            ...(aiConfiguration.audience !== undefined && {
              audience: aiConfiguration.audience,
            }),
            ...(aiConfiguration.contentLength !== undefined && {
              contentLength: aiConfiguration.contentLength,
            }),
            ...(aiConfiguration.tone !== undefined && {
              tone: aiConfiguration.tone,
            }),
          },
        }
      } else {
        updateData.aiConfiguration = {
          create: {
            language: aiConfiguration.language ?? 'es',
            targetLevel:
              aiConfiguration.targetLevel ?? AiTargetLevel.INTERMEDIATE,
            audience: aiConfiguration.audience ?? AiAudience.UNIVERSITY,
            contentLength: aiConfiguration.contentLength ?? AiLength.MEDIUM,
            tone: aiConfiguration.tone ?? AiTone.EDUCATIONAL,
          },
        }
      }
    }

    const module = await this.dbService.module.update({
      where: { id },
      data: updateData,
      include: {
        aiConfiguration: true,
      },
    })

    return ModulesMapper.mapToDto(module)
  }

  async toggleActive(id: number, user: User): Promise<ModuleDto> {
    const existingModule = await this.dbService.module.findUnique({
      where: { id },
      include: {
        aiConfiguration: true,
      },
    })

    if (!existingModule) {
      throw new NotFoundException(`Módulo con ID ${id} no encontrado`)
    }

    if (existingModule.teacherId !== user.id) {
      throw new BusinessException(
        'Solo el profesor propietario puede cambiar el estado del módulo',
        HttpStatus.FORBIDDEN,
      )
    }

    const module = await this.dbService.module.update({
      where: { id },
      data: {
        isActive: !existingModule.isActive,
      },
      include: {
        aiConfiguration: true,
      },
    })

    return ModulesMapper.mapToDto(module)
  }
}
