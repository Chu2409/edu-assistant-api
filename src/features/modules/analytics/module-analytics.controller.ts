import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  HttpStatus,
} from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger'
import { ModuleAnalyticsService } from './module-analytics.service'
import { ModuleAnalyticsDto } from './dtos/res/module-analytics.dto'
import { JwtAuth } from 'src/features/auth/decorators/jwt-auth.decorator'
import { GetUser } from 'src/features/auth/decorators/get-user.decorator'
import { Role, type User } from 'src/core/database/generated/client'
import { ModulesService } from '../main/modules.service'
import { AuthorizationUtils } from 'src/shared/utils/authorization.util'
import { ApiStandardResponse } from 'src/shared/decorators/api-standard-response.decorator'

@ApiTags('Modules Analytics')
@ApiBearerAuth()
@Controller('modules')
export class ModuleAnalyticsController {
  constructor(
    private readonly analyticsService: ModuleAnalyticsService,
    private readonly modulesService: ModulesService,
  ) {}

  @Get(':id/analytics')
  @ApiOperation({
    summary: 'Obtener analíticas del módulo',
    description:
      'Permite a los profesores ver métricas de uso y progreso de sus estudiantes. Solo accesible por el profesor propietario o ADMIN.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del módulo',
    example: 1,
  })
  @ApiStandardResponse(ModuleAnalyticsDto)
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({
    status: 403,
    description: 'Prohibido - No eres el dueño del módulo',
  })
  @ApiResponse({ status: 404, description: 'Módulo no encontrado' })
  @JwtAuth(Role.TEACHER, Role.ADMIN)
  async getModuleAnalytics(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: User,
  ): Promise<ModuleAnalyticsDto> {
    // 1. Fetch module to check ownership (throws 404 if not found)
    const module = await this.modulesService.findOne(id, user)

    // 2. Security Check: Only the teacher of the module or ADMIN can access analytics
    // We use assertModuleWriteAccess because it perfectly matches our requirement: owner teacher or admin.
    AuthorizationUtils.assertModuleWriteAccess(user, {
      teacherId: module.teacherId,
    })

    // 3. Fetch analytics
    return this.analyticsService.getModuleAnalytics(id)
  }
}
