import { ApiProperty } from '@nestjs/swagger'
import { USER_ROLE } from '../../types/user-role.enum'

export class UserResDto {
  @ApiProperty({
    description: 'ID of the user',
    example: 'cixf02ym000001b66m45ae4k8',
  })
  id: string

  @ApiProperty({
    description: 'Email of the user',
    example: 'jperez1231@uta.edu.ec',
  })
  email: string

  @ApiProperty({
    description: 'First name of the user',
    example: 'Juan',
  })
  firstName: string

  @ApiProperty({
    description: 'Last name of the user',
    example: 'Pérez',
  })
  lastName: string

  @ApiProperty({
    description: 'Role of the user',
    example: USER_ROLE.ADMIN,
  })
  role: USER_ROLE

  @ApiProperty({
    description: 'Is active of the user',
    example: true,
  })
  isActive: boolean

  @ApiProperty({
    description: 'Created at of the user',
    example: '2021-01-01T00:00:00.000Z',
  })
  createdAt: Date

  @ApiProperty({
    description: 'Updated at of the user',
    example: '2021-01-01T00:00:00.000Z',
  })
  updatedAt: Date
}
