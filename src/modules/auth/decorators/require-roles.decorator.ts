import { SetMetadata } from '@nestjs/common'
import { Role } from 'src/core/database/generated/enums'

export const ROLES_KEY = 'roles'
export const RequireRoles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles)
