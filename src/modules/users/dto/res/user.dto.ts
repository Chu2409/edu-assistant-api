import { ApiProperty } from '@nestjs/swagger'
import { USER_TYPE } from '../../types/user-type.enum'
import { USER_STATUS } from '../../types/user-status.enum'
import { PersonResDto } from 'src/modules/people/dto/res/person.dto'

export class BaseUserResDto {
  @ApiProperty({
    description: 'id del usuario',
    example: 1,
  })
  id: number

  @ApiProperty({
    description: 'username del usuario',
    example: 'ezhu7643',
  })
  username: string

  @ApiProperty({
    description: 'tipo de usuario',
    example: USER_TYPE.ADMINISTRATOR,
  })
  type: USER_TYPE

  @ApiProperty({
    description: 'estado del usuario',
    example: USER_STATUS.ACTIVE,
  })
  status: USER_STATUS
}

export class UserResDto extends BaseUserResDto {
  @ApiProperty({
    description: 'id de la persona',
    example: 1,
  })
  personId: number
}

export class UserPersonResDto extends BaseUserResDto {
  @ApiProperty({
    description: 'persona asociada al usuario',
    type: PersonResDto,
  })
  person: PersonResDto
}
