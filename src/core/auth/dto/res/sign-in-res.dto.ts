import { ApiProperty } from '@nestjs/swagger'
import { UserPersonResDto } from 'src/core/users/dto/res/user.dto'

export class SignInResDto {
  @ApiProperty({
    description: 'JWT token',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaXNBZG1pbiI6dHJ1ZSwiaWF0IjoxNzQ2MDE3MTY2LCJleHAiOjE3NDYwMjQzNjZ9.cZwdsfG5wYTWSgCnuSBCnB9GhJc24UksisDpx5nlaZI',
  })
  token: string

  @ApiProperty({
    description: 'User data',
    type: UserPersonResDto,
  })
  user: UserPersonResDto
}
