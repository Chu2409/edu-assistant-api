import { Module } from '@nestjs/common'
import { CoreModule } from './core/core.module'
import { HealthController } from './health.controller'
import { ResponseInterceptor } from './shared/interceptors/response.interceptor'
import { AuthModule } from './features/auth/auth.module'
import { ModulesModule } from './features/modules/main/modules.module'
import { PagesModule } from './features/pages/main/pages.module'
import { UsersModule } from './features/users/users.module'
import { APP_GUARD } from '@nestjs/core'
import { JwtAuthGuard } from './features/auth/guards/jwt-auth.guard'
import { FilesModule } from './providers/files/files.module'
import { InteractionsModule } from './features/interactions/interactions.module'

@Module({
  imports: [
    CoreModule,
    AuthModule,
    ModulesModule,
    PagesModule,
    UsersModule,
    FilesModule,
    InteractionsModule,
  ],
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
