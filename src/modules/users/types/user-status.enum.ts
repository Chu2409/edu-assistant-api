import { UserStatus } from '@prisma/client'

export const USER_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED',
} as const satisfies Record<UserStatus, UserStatus>

export type USER_STATUS = (typeof USER_STATUS)[keyof typeof USER_STATUS]
