import { Module } from '@nestjs/common'
import { CoreModule } from './core/core.module'
import { HealthController } from './health.controller'
import { ResponseInterceptor } from './shared/interceptors/response.interceptor'
import { AuthModule } from './features/auth/auth.module'
import { ModulesModule } from './features/modules/main/modules.module'
import { EnrollmentsModule } from './features/enrollments/enrollments.module'
import { PagesModule } from './features/pages/main/pages.module'
import { PageFeedbacksModule } from './features/pages/page-feedbacks/page-feedbacks.module'
import { PageNotesModule } from './features/pages/notes/page-notes.module'
import { PageConceptsModule } from './features/pages/page-concepts/page-concepts.module'
import { ChatModule } from './features/pages/chat/chat.module'
import { ActivitiesModule } from './features/pages/activities/activities.module'
import { PageRelationsModule } from './features/pages/page-relations/page-relations.module'
import { MediaResourcesModule } from './features/pages/media-resources/media-resources.module'

@Module({
  imports: [
    CoreModule,
    AuthModule,
    ModulesModule,
    EnrollmentsModule,
    PagesModule,
    PageFeedbacksModule,
    PageNotesModule,
    PageConceptsModule,
    ChatModule,
    ActivitiesModule,
    PageRelationsModule,
    MediaResourcesModule,
  ],
  controllers: [HealthController],
  providers: [
    ResponseInterceptor,
    // {
    //   provide: APP_GUARD,
    //   useClass: JwtAuthGuard,
    // },
  ],
})
export class AppModule {}
