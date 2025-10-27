import { Module } from '@nestjs/common'
import { GlobalModule } from './global/global.module'
import { HealthController } from './health.controller'
import { ResponseInterceptor } from './common/interceptors/response.interceptor'
import { APP_GUARD } from '@nestjs/core'
import { JwtAuthGuard } from './core/auth/guards/jwt-auth.guard'

@Module({
  imports: [GlobalModule],
  controllers: [HealthController],
  providers: [
    ResponseInterceptor,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
