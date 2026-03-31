import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { DBService } from 'src/core/database/database.service'
import { SYSTEM_CONFIG_KEYS } from 'src/shared/constants/configurations'
import { DEFAULT_MODELS } from '../constants/models'
import { AiModelConfig } from '../interfaces/ai-model-config'

@Injectable()
export class AiConfigService implements OnModuleInit {
  private readonly logger = new Logger(AiConfigService.name)
  private modelConfig: AiModelConfig = { ...DEFAULT_MODELS }

  constructor(private dbService: DBService) {}

  async onModuleInit() {
    try {
      const setting = await this.dbService.systemSetting.findUnique({
        where: { key: SYSTEM_CONFIG_KEYS.AI_MODELS },
      })
      if (setting && setting.value) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.modelConfig = { ...this.modelConfig, ...(setting.value as any) }
      } else {
        await this.dbService.systemSetting.create({
          data: {
            key: SYSTEM_CONFIG_KEYS.AI_MODELS,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            value: this.modelConfig as any,
            description: 'Modelos de OpenAI configurados globalmente',
          },
        })
      }
    } catch (e) {
      this.logger.error('Error loading AI_MODELS config from DB', e)
    }
  }

  getModelConfig(): AiModelConfig {
    return { ...this.modelConfig }
  }

  async setModelConfig(config: Partial<AiModelConfig>): Promise<AiModelConfig> {
    this.modelConfig = { ...this.modelConfig, ...config }

    await this.dbService.systemSetting.upsert({
      where: { key: SYSTEM_CONFIG_KEYS.AI_MODELS },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      update: { value: this.modelConfig as any },
      create: {
        key: SYSTEM_CONFIG_KEYS.AI_MODELS,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        value: this.modelConfig as any,
        description: 'Modelos de OpenAI configurados globalmente',
      },
    })

    return this.getModelConfig()
  }
}
