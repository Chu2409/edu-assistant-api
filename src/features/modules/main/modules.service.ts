import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common'
import { DBService } from 'src/core/database/database.service'
import { CreateModuleDto } from './dtos/req/create-module.dto'
import { UpdateModuleDto } from './dtos/req/update-module.dto'
import { ModuleDto } from './dtos/res/module.dto'
import type {
  AiConfiguration,
  Module,
  User,
} from 'src/core/database/generated/client'
import { BaseParamsReqDto } from 'src/shared/dtos/req/base-params.dto'
import { AiConfigurationDto } from 'src/features/modules/ai-configurations/dtos/res/ai-configuration.dto'

@Injectable()
export class ModulesService {
  constructor(private readonly dbService: DBService) {}

  async create(
    createModuleDto: CreateModuleDto,
    user: User,
  ): Promise<ModuleDto> {
    const module = await this.dbService.module.create({
      data: {
        title: createModuleDto.title,
        description: createModuleDto.description,
        teacherId: user.id,
        isPublic: createModuleDto.isPublic ?? false,
        allowSelfEnroll: createModuleDto.allowSelfEnroll ?? true,
        logoUrl: createModuleDto.logoUrl,
        aiConfiguration: createModuleDto.aiConfiguration
          ? {
              create: {
                language: createModuleDto.aiConfiguration.language ?? 'es',
                contextPrompt: createModuleDto.aiConfiguration.contextPrompt,
                temperature: createModuleDto.aiConfiguration.temperature ?? 0.7,
              },
            }
          : undefined,
      },
      include: {
        aiConfiguration: true,
      },
    })

    return this.mapToDto(module)
  }

  async findAll(params: BaseParamsReqDto, user: User): Promise<ModuleDto[]> {
    const modules = await this.dbService.module.findMany({
      where: {
        OR: [{ teacherId: user.id }, { isPublic: true }],
      },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        aiConfiguration: true,
      },
    })

    return modules.map((module) => this.mapToDto(module))
  }

  async findMyEnrolledModules(
    params: BaseParamsReqDto,
    user: User,
  ): Promise<ModuleDto[]> {
    const enrollments = await this.dbService.enrollment.findMany({
      where: {
        userId: user.id,
        isActive: true,
      },
      include: {
        module: {
          include: {
            aiConfiguration: true,
          },
        },
      },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
      orderBy: {
        enrolledAt: 'desc',
      },
    })

    return enrollments.map((enrollment) => this.mapToDto(enrollment.module))
  }

  async findOne(id: string, user: User): Promise<ModuleDto> {
    const module = await this.dbService.module.findUnique({
      where: { id },
      include: {
        aiConfiguration: true,
      },
    })

    if (!module) {
      throw new NotFoundException(`Módulo con ID ${id} no encontrado`)
    }

    // Verificar permisos: solo el profesor o módulos públicos
    if (module.teacherId !== user.id && !module.isPublic) {
      throw new ForbiddenException(
        'No tienes permisos para acceder a este módulo',
      )
    }

    return this.mapToDto(module)
  }

  async update(
    id: string,
    updateModuleDto: UpdateModuleDto,
    user: User,
  ): Promise<ModuleDto> {
    // Verificar que el módulo existe y pertenece al usuario
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
      throw new ForbiddenException(
        'Solo el profesor propietario puede actualizar el módulo',
      )
    }

    // Preparar datos de actualización del módulo (sin aiConfiguration)
    const { aiConfiguration, ...moduleData } = updateModuleDto

    // Construir datos de actualización con nested write para aiConfiguration
    const updateData: any = { ...moduleData }

    if (aiConfiguration !== undefined) {
      if (existingModule.aiConfiguration) {
        // Si existe, actualizar
        updateData.aiConfiguration = {
          update: {
            ...(aiConfiguration.language !== undefined && {
              language: aiConfiguration.language,
            }),
            ...(aiConfiguration.contextPrompt !== undefined && {
              contextPrompt: aiConfiguration.contextPrompt,
            }),
            ...(aiConfiguration.temperature !== undefined && {
              temperature: aiConfiguration.temperature,
            }),
          },
        }
      } else {
        // Si no existe, crear
        updateData.aiConfiguration = {
          create: {
            language: aiConfiguration.language ?? 'es',
            contextPrompt: aiConfiguration.contextPrompt,
            temperature: aiConfiguration.temperature ?? 0.7,
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

    return this.mapToDto(module)
  }

  async remove(id: string, user: User): Promise<void> {
    // Verificar que el módulo existe y pertenece al usuario
    const existingModule = await this.dbService.module.findUnique({
      where: { id },
    })

    if (!existingModule) {
      throw new NotFoundException(`Módulo con ID ${id} no encontrado`)
    }

    if (existingModule.teacherId !== user.id) {
      throw new ForbiddenException(
        'Solo el profesor propietario puede eliminar el módulo',
      )
    }

    await this.dbService.module.delete({
      where: { id },
    })
  }

  private mapToDto(
    module: Module & { aiConfiguration?: AiConfiguration | null },
  ): ModuleDto {
    return {
      id: module.id,
      title: module.title,
      description: module.description,
      teacherId: module.teacherId,
      isPublic: module.isPublic,
      allowSelfEnroll: module.allowSelfEnroll,
      logoUrl: module.logoUrl,
      isActive: module.isActive,
      createdAt: module.createdAt,
      updatedAt: module.updatedAt,
      aiConfiguration: module.aiConfiguration
        ? this.mapAiConfigurationToDto(module.aiConfiguration)
        : null,
    }
  }

  private mapAiConfigurationToDto(
    aiConfig: AiConfiguration,
  ): AiConfigurationDto {
    return {
      id: aiConfig.id,
      moduleId: aiConfig.moduleId,
      language: aiConfig.language,
      contextPrompt: aiConfig.contextPrompt,
      temperature: aiConfig.temperature,
      createdAt: aiConfig.createdAt,
      updatedAt: aiConfig.updatedAt,
    }
  }
}
