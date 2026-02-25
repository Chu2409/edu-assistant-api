import { Controller, Get, Res } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import type { Response } from 'express'
import { AuthService } from './auth.service'
import type { User } from 'src/core/database/generated/client'
import { CustomConfigService } from 'src/core/config/config.service'
import { GetUser } from './decorators/get-user.decorator'
import { MicrosoftAuth } from './decorators/microsoft-auth.decorator'
import { ApiStandardResponse } from 'src/shared/decorators/api-standard-response.decorator'
import { UserDto } from '../users/dtos/res/user.dto'
import { Public } from './decorators/public-route.decorator'

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: CustomConfigService,
  ) {}

  @Get('microsoft')
  @MicrosoftAuth()
  @Public()
  async microsoftAuth() {}

  @Get('microsoft/callback')
  @MicrosoftAuth()
  @Public()
  microsoftAuthCallback(@GetUser() user: User, @Res() res: Response) {
    const token = this.authService.generateJwt(user)
    const frontendUrl = this.configService.env.FRONTEND_URL

    res.redirect(`${frontendUrl}/auth/success?token=${token}`)
  }

  @Get('profile')
  @ApiOperation({ summary: 'Obtener perfil del usuario autenticado' })
  @ApiStandardResponse(UserDto)
  @ApiResponse({ status: 401, description: 'No autorizado' })
  getProfile(@GetUser() user: User) {
    return user
  }
}
