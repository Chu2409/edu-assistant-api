import { Controller, Get } from '@nestjs/common'
import { DBService } from './core/database/database.service'
import { Public } from './modules/auth/decorators/public-route.decorator'

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: DBService) {}

  @Get()
  @Public()
  check() {
    return { status: 'OK', timestamp: new Date().toISOString() }
  }

  @Get('db')
  @Public()
  async checkDatabase() {
    // Verificar la conexión a la base de datos
    await this.prisma.$queryRaw`SELECT 1`

    return {
      status: 'OK',
      database: 'connected',
      timestamp: new Date().toISOString(),
    }
  }
}
