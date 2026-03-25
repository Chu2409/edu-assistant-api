import { Module } from '@nestjs/common'
import { ModulesController } from './modules.controller'
import { ModulesService } from './modules.service'
import { EnrollmentsController } from '../enrollments/enrollments.controller'
import { EnrollmentsService } from '../enrollments/enrollments.service'

@Module({
  controllers: [ModulesController, EnrollmentsController],
  providers: [ModulesService, EnrollmentsService],
  exports: [ModulesService, EnrollmentsService],
})
export class ModulesModule {}
