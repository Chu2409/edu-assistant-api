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
