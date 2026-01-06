import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { AuthGuard } from '@nestjs/passport'
import { Observable } from 'rxjs'
import { IS_PUBLIC_KEY } from '../decorators/public-route.decorator'
import { ROLES_KEY } from '../decorators/require-roles.decorator'
import { Role } from 'src/core/database/generated/enums'
import { User } from 'src/core/database/generated/client'

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super()
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (isPublic) {
      return true
    }

    return super.canActivate(context)
  }

  // @ts-expect-error User is not assignable to any
  handleRequest(
    err: unknown,
    user: User | null,
    info: unknown,
    context: ExecutionContext,
  ) {
    if (err || !user) {
      throw new UnauthorizedException('Error de autenticación')
    }

    this.validateRoles(context, user)

    return user
  }

  private validateRoles(context: ExecutionContext, user: User): void {
    const requiredRoles = this.reflector.getAllAndOverride<Role[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    )

    if (!requiredRoles) {
      return
    }

    const hasRole = requiredRoles.some((role) => user.role === role)
    if (!hasRole) {
      throw new ForbiddenException(
        'No tienes permisos suficientes para acceder a este recurso',
      )
    }
  }
}
