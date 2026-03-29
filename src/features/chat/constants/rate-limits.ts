import { ChatRateLimits } from '../interfaces/rate-limits-config'

export const DEFAULT_RATE_LIMITS: ChatRateLimits = {
  hourlyLimit: 20,
  dailyLimit: 100,
}
