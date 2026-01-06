import { Controller, Get, Res } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import type { Response } from 'express'
import { AuthService } from './auth.service'
import type { User } from 'src/core/database/generated/client'
import { CustomConfigService } from 'src/core/config/config.service'
import { GetUser } from './decorators/get-user.decorator'
import { MicrosoftAuth } from './decorators/microsoft-auth.decorator'
import { JwtAuth } from './decorators/jwt-auth.decorator'

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: CustomConfigService,
  ) {}

  @Get('microsoft')
  @MicrosoftAuth()
  async microsoftAuth() {}

  @Get('microsoft/callback')
  @MicrosoftAuth()
  microsoftAuthCallback(@GetUser() user: User, @Res() res: Response) {
    const token = this.authService.generateJwt(user)
    const frontendUrl = this.configService.env.FRONTEND_URL

    res.redirect(`${frontendUrl}/auth/success?token=${token}`)
  }

  @Get('profile')
  @JwtAuth()
  @ApiOperation({ summary: 'Obtener perfil del usuario autenticado' })
  @ApiResponse({
    status: 200,
    description: 'Perfil del usuario obtenido exitosamente',
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  getProfile(@GetUser() user: User) {
    return {
      message: 'Perfil del usuario autenticado',
      user,
    }
  }
}
