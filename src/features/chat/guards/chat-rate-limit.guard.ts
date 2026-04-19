import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
} from '@nestjs/common'
import { BusinessException } from 'src/shared/exceptions/business.exception'
import { Role } from 'src/core/database/generated/enums'
import { ChatRateLimitService } from '../services/chat-rate-limit.service'

@Injectable()
export class ChatRateLimitGuard implements CanActivate {
  constructor(private readonly chatRateLimitService: ChatRateLimitService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const user = request.user

    // Solo limitar a estudiantes
    if (!user || user.role !== Role.STUDENT) {
      return true
    }

    const { allowed, reason } =
      await this.chatRateLimitService.checkStudentLimits(user.id)

    if (!allowed) {
      throw new BusinessException(
        reason ?? 'Límite de mensajes alcanzado',
        HttpStatus.TOO_MANY_REQUESTS,
      )
    }

    return true
  }
}
