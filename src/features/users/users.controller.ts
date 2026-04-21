import { Controller, Get, Query } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { UsersService } from './users.service'
import { UsersFiltersDto } from './dtos/req/users-filters.dto'
import { UserDto } from './dtos/res/user.dto'
import { JwtAuth } from 'src/features/auth/decorators/jwt-auth.decorator'
import { Role } from 'src/core/database/generated/client'
import { ApiStandardResponse } from 'src/shared/decorators/api-standard-response.decorator'

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('students')
  @ApiOperation({
    summary: 'Obtener lista de estudiantes',
    description:
      'Devuelve una lista paginada de estudiantes (máximo 20 a la vez). Permite buscar por nombre, apellido o email.',
  })
  @ApiStandardResponse(UserDto)
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Prohibido' })
  @JwtAuth(Role.TEACHER)
  findStudents(@Query() params: UsersFiltersDto): Promise<UserDto[]> {
    return this.usersService.findStudents(params)
  }
}
