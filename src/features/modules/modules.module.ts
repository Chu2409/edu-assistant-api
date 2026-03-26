import { Module } from '@nestjs/common'
import { ModulesController } from './main/modules.controller'
import { ModulesService } from './main/modules.service'
import { EnrollmentsController } from './enrollments/enrollments.controller'
import { EnrollmentsService } from './enrollments/enrollments.service'

@Module({
  controllers: [ModulesController, EnrollmentsController],
  providers: [ModulesService, EnrollmentsService],
  exports: [ModulesService, EnrollmentsService],
})
export class ModulesModule {}
