import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { JwtAuth } from 'src/features/auth/decorators/jwt-auth.decorator'
import { GetUser } from 'src/features/auth/decorators/get-user.decorator'
import { LoProgressService } from './lo-progress.service'
import { MarkLoVisitedDto } from './dtos/req/mark-lo-visited.dto'
import { LoProgressDto } from './dtos/res/lo-progress.dto'

@ApiTags('Learning Object Progress')
@Controller('lo-progress')
@JwtAuth()
export class LoProgressController {
  constructor(private readonly loProgressService: LoProgressService) {}

  @Post('visit')
  @ApiOperation({ summary: 'Marcar un objeto de aprendizaje como visitado o completado' })
  @ApiResponse({ status: 201, type: LoProgressDto })
  markVisited(
    @GetUser('id') userId: number,
    @Body() dto: MarkLoVisitedDto,
  ) {
    return this.loProgressService.markVisited(userId, dto)
  }

  @Get(':learningObjectId')
  @ApiOperation({ summary: 'Obtener el progreso de un estudiante en un objeto de aprendizaje' })
  @ApiResponse({ status: 200, type: LoProgressDto })
  getProgress(
    @GetUser('id') userId: number,
    @Param('learningObjectId', ParseIntPipe) learningObjectId: number,
  ) {
    return this.loProgressService.getProgress(userId, learningObjectId)
  }
}
