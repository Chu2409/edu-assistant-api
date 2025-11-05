import { Role } from '@prisma/client'

export const USER_ROLE = {
  ADMIN: 'ADMIN',
  TEACHER: 'TEACHER',
  STUDENT: 'STUDENT',
} as const satisfies Record<Role, Role>

export type USER_ROLE = (typeof USER_ROLE)[keyof typeof USER_ROLE]
