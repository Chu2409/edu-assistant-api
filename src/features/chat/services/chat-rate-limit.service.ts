import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { DBService } from 'src/core/database/database.service'
import { SYSTEM_CONFIG_KEYS } from 'src/shared/constants/configurations'
import { MessageRole } from 'src/core/database/generated/enums'
import { ChatRateLimits } from '../interfaces/rate-limits-config'
import { DEFAULT_RATE_LIMITS } from '../constants/rate-limits'

@Injectable()
export class ChatRateLimitService implements OnModuleInit {
  private readonly logger = new Logger(ChatRateLimitService.name)
  private limits: ChatRateLimits = { ...DEFAULT_RATE_LIMITS }

  constructor(private readonly dbService: DBService) {}

  async onModuleInit() {
    try {
      const setting = await this.dbService.systemSetting.findUnique({
        where: { key: SYSTEM_CONFIG_KEYS.CHAT_RATE_LIMITS },
      })

      if (setting && setting.value) {
        this.limits = { ...this.limits, ...(setting.value as object) }
      } else {
        await this.dbService.systemSetting.create({
          data: {
            key: SYSTEM_CONFIG_KEYS.CHAT_RATE_LIMITS,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            value: this.limits as any,
            description:
              'Límites de mensajes de chat para estudiantes: { hourlyLimit, dailyLimit }',
          },
        })
      }

      this.logger.log(
        `Chat rate limits loaded: ${this.limits.hourlyLimit}/hour, ${this.limits.dailyLimit}/day`,
      )
    } catch (e) {
      this.logger.error('Error loading CHAT_RATE_LIMITS config from DB', e)
    }
  }

  getLimits(): ChatRateLimits {
    return { ...this.limits }
  }

  async checkStudentLimits(
    userId: number,
  ): Promise<{ allowed: boolean; reason?: string }> {
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    // Contamos mensajes con role='user' (solo los del estudiante, no los de la IA)
    const [hourlyCount, dailyCount] = await Promise.all([
      this.dbService.message.count({
        where: {
          session: { userId },
          role: MessageRole.user,
          createdAt: { gte: oneHourAgo },
        },
      }),
      this.dbService.message.count({
        where: {
          session: { userId },
          role: MessageRole.user,
          createdAt: { gte: oneDayAgo },
        },
      }),
    ])

    if (hourlyCount >= this.limits.hourlyLimit) {
      return {
        allowed: false,
        reason: `Has alcanzado el límite de ${this.limits.hourlyLimit} mensajes por hora. Intenta de nuevo más tarde.`,
      }
    }

    if (dailyCount >= this.limits.dailyLimit) {
      return {
        allowed: false,
        reason: `Has alcanzado el límite de ${this.limits.dailyLimit} mensajes por día. Intenta de nuevo mañana.`,
      }
    }

    return { allowed: true }
  }
}
