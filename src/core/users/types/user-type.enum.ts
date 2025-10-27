import { UserType } from '@prisma/client'

export const USER_TYPE = {
  ADMINISTRATOR: 'ADMINISTRATOR',
  MANAGER: 'MANAGER',
} as const satisfies Record<UserType, UserType>

export type USER_TYPE = (typeof USER_TYPE)[keyof typeof USER_TYPE]
