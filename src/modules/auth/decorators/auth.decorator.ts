import { applyDecorators, UseGuards } from '@nestjs/common'
import { RoleProtected } from './role-protected.decorator'
import { AuthGuard } from '@nestjs/passport'
import { USER_ROLE } from 'src/modules/users/types/user-role.enum'
import { JwtAuthGuard } from '../guards/jwt-auth.guard'

export function Auth(...roles: USER_ROLE[]) {
  return applyDecorators(
    RoleProtected(...roles),
    UseGuards(AuthGuard(), JwtAuthGuard),
  )
}
