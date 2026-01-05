import { applyDecorators, UseGuards } from '@nestjs/common'
import { ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../guards/jwt-auth.guard'
import { RequireRoles } from './require-roles.decorator'
import { Role } from 'src/core/database/generated/enums'

export const JwtAuth = (...roles: Role[]) => {
  if (roles.length > 0) {
    return applyDecorators(
      UseGuards(JwtAuthGuard),
      RequireRoles(...roles),
      ApiBearerAuth(),
    )
  }
  return applyDecorators(UseGuards(JwtAuthGuard), ApiBearerAuth())
}
