import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common'
import { CustomConfigService } from 'src/core/config/config.service'
import Redis from 'ioredis'

/**
 * EmailDailyLimitService
 *
 * Uses Redis to enforce a daily limit on emails sent.
 * Uses a Lua script for atomic check-and-increment to avoid race conditions.
 *
 * Key format: email:daily:YYYY-MM-DD
 * TTL: 86400 seconds (24 hours)
 */
@Injectable()
export class EmailDailyLimitService implements OnModuleDestroy {
  private readonly logger = new Logger(EmailDailyLimitService.name)
  private readonly redis: Redis
  private readonly limit: number
  private readonly ttlSeconds = 86400

  // Lua script for atomic increment with limit check
  // Returns 1 if email can be sent, 0 if limit reached
  private readonly luaScript = `
    local key = KEYS[1]
    local limit = tonumber(ARGV[1])
    local ttl = tonumber(ARGV[2])

    local current = redis.call('GET', key)
    current = (current and tonumber(current)) or 0

    if current >= limit then
      return 0
    end

    local newCount = redis.call('INCR', key)

    if newCount == 1 then
      redis.call('EXPIRE', key, ttl)
    end

    return 1
  `

  constructor(private readonly configService: CustomConfigService) {
    this.redis = new Redis({
      host: this.configService.env.REDIS_HOST,
      port: this.configService.env.REDIS_PORT,
    })

    // Default to 1000 if not configured
    this.limit = this.configService.env.EMAIL_DAILY_LIMIT ?? 1000

    this.logger.log(
      `EmailDailyLimitService initialized with limit: ${this.limit}`,
    )
  }

  async onModuleDestroy() {
    await this.redis.quit()
  }

  /**
   * Get the Redis key for today's email counter
   */
  private getTodayKey(): string {
    const today = new Date().toISOString().split('T')[0]
    return `email:daily:${today}`
  }

  /**
   * Check if we can send an email (under the daily limit)
   * Uses atomic Lua script to avoid race conditions
   *
   * @returns true if we can send, false if limit reached
   */
  async canSendEmail(): Promise<boolean> {
    const key = this.getTodayKey()

    try {
      const result = await this.redis.eval(
        this.luaScript,
        1,
        key,
        this.limit,
        this.ttlSeconds,
      )

      const canSend = result === 1

      if (!canSend) {
        this.logger.warn(
          `Daily email limit reached (${this.limit}). Email rejected.`,
        )
      }

      return canSend
    } catch (error) {
      this.logger.error(`Redis error in canSendEmail: ${error}`)
      // Graceful degradation: if Redis fails, allow sending
      // but log the error for monitoring
      return true
    }
  }

  /**
   * Get current email count for today
   */
  async getTodayCount(): Promise<number> {
    const key = this.getTodayKey()

    try {
      const count = await this.redis.get(key)
      return count ? parseInt(count, 10) : 0
    } catch (error) {
      this.logger.error(`Redis error in getTodayCount: ${error}`)
      return 0
    }
  }

  /**
   * Get remaining emails for today
   */
  async getRemainingCount(): Promise<number> {
    const current = await this.getTodayCount()
    return Math.max(0, this.limit - current)
  }

  /**
   * Reset counter for a specific date (for testing/admin purposes)
   */
  async resetDate(date: string): Promise<void> {
    const key = `email:daily:${date}`
    await this.redis.del(key)
    this.logger.log(`Email counter reset for ${date}`)
  }

  /**
   * Check if Redis connection is healthy
   */
  async isHealthy(): Promise<boolean> {
    try {
      const pong = await this.redis.ping()
      return pong === 'PONG'
    } catch {
      return false
    }
  }
}