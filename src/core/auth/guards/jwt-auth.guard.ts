import { ExecutionContext, Injectable, HttpStatus } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { Reflector } from '@nestjs/core'
import { IS_PUBLIC_KEY } from '../decorators/public-route.decorator'
import { Observable } from 'rxjs'
import { BusinessException } from 'src/common/exceptions/business.exception'
import { UserPersonResDto } from 'src/core/users/dto/res/user.dto'

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super()
  }

  // 1. Verifica si la ruta es pública (-> strategy)
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

  // 4. Verifica si el usuario tiene los permisos necesarios (-> strategy)
  handleRequest<TUser = UserPersonResDto>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    err: any,
    user: TUser | null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    info: any,
    context: ExecutionContext,
  ) {
    // Primero verificamos la autenticación
    if (err || !user) {
      throw new BusinessException(
        'Inicie sesión para continuar',
        HttpStatus.UNAUTHORIZED,
      )
    }

    // Luego verificamos los permisos
    // const requiredPermissions = this.reflector.getAllAndOverride<
    //   string[] | undefined
    // >(PERMISSIONS_KEY, [context.getHandler(), context.getClass()])

    // if (requiredPermissions && requiredPermissions.length > 0) {
    //   const userPermissions = user.role.actions
    //   const hasPermission = requiredPermissions.some((permission) =>
    //     userPermissions.includes(permission),
    //   )

    //   if (!hasPermission) {
    //     throw new BusinessException(
    //       'No tienes permisos para acceder a este recurso',
    //       HttpStatus.FORBIDDEN,
    //     )
    //   }
    // }

    return user
  }
}
