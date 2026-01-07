import { AiConfiguration, Module } from 'src/core/database/generated/client'
import { ModuleDto } from '../dtos/res/module.dto'
import { AiConfigurationDto } from '../../ai-configurations/dtos/res/ai-configuration.dto'

export class ModulesMapper {
  static mapToDto(
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

  static mapAiConfigurationToDto(
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
