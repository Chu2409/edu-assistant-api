import { applyDecorators, UseGuards } from '@nestjs/common'
import { RoleProtected } from './role-protected.decorator'
import { AuthGuard } from '@nestjs/passport'
import { USER_TYPE } from 'src/core/users/types/user-type.enum'
import { JwtAuthGuard } from '../guards/jwt-auth.guard'

export function Auth(...roles: USER_TYPE[]) {
  return applyDecorators(
    RoleProtected(...roles),
    UseGuards(AuthGuard(), JwtAuthGuard),
  )
}
