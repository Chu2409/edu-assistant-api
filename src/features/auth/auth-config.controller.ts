import { Body, Controller, Get, Patch } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { ApiStandardResponse } from 'src/shared/decorators/api-standard-response.decorator'
import { JwtAuth } from './decorators/jwt-auth.decorator'
import { Role } from 'src/core/database/generated/client'
import { TeacherEmailsDto } from './dtos/teacher-emails.dto'
import { AuthConfigService } from './services/auth-config.service'

@ApiTags('Auth Config')
@Controller('auth/config')
@JwtAuth(Role.ADMIN)
export class AuthConfigController {
  constructor(private readonly authConfigService: AuthConfigService) {}

  @Get('teachers/emails')
  @ApiOperation({
    summary: 'Obtener lista de correos configurados como profesores',
    description:
      'Devuelve la lista en memoria de correos electrónicos que serán tratados con rol de profesor al autenticarse.',
  })
  @ApiStandardResponse(TeacherEmailsDto)
  getTeacherEmails(): TeacherEmailsDto {
    return { emails: this.authConfigService.getTeacherEmails() }
  }

  @Patch('teachers/emails')
  @ApiOperation({
    summary: 'Configurar lista de correos de profesores',
    description:
      'Reemplaza la lista global de correos electrónicos que se tratarán como profesores. La configuración persiste en base de datos.',
  })
  @ApiStandardResponse(TeacherEmailsDto)
  async updateTeacherEmails(
    @Body() dto: TeacherEmailsDto,
  ): Promise<TeacherEmailsDto> {
    const emails = await this.authConfigService.setTeacherEmails(dto.emails)
    return { emails }
  }
}
