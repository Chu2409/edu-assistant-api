import { Controller, Get } from '@nestjs/common'
import { DBService } from './core/database/database.service'
import { Public } from './features/auth/decorators/public-route.decorator'

@Controller('health')
@Public()
export class HealthController {
  constructor(private readonly dbService: DBService) {}

  @Get()
  check() {
    return { status: 'OK', timestamp: new Date().toISOString() }
  }

  // @Get('email')
  // async testEmail() {
  //   await this.emailService.sendEmail({
  //     to: 'ezhu7643@uta.edu.ec',
  //     subject: 'Test Email from Edu Assistant API',
  //     body: '<h1>¡Hola!</h1><p>Este es un correo de prueba enviado desde el Health Controller para verificar la integración con Microsoft Graph.</p>',
  //     isHtml: true,
  //   })

  //   return {
  //     status: 'OK',
  //     message: 'Test email sent successfully to ezhu7643@uta.edu.ec',
  //     timestamp: new Date().toISOString(),
  //   }
  // }

  @Get('db')
  async checkDatabase() {
    // Verificar la conexión a la base de datos
    await this.dbService.$queryRaw`SELECT 1`

    return {
      status: 'OK',
      database: 'connected',
      timestamp: new Date().toISOString(),
    }
  }
}
