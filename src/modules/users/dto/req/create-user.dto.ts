import { IsEmail, IsEnum, IsNotEmpty, IsString } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'
import { USER_ROLE } from '../../types/user-role.enum'
export class CreateUserReqDto {
  @ApiProperty({
    description: 'Email of the user (must be unique)',
    example: 'jperez1231@uta.edu.ec',
  })
  @IsEmail()
  email: string

  @IsString({ message: 'password must be a string' })
  @IsNotEmpty({ message: 'password is required' })
  @ApiProperty({
    description: 'The password of the user',
    example: 'password',
  })
  password: string

  @ApiProperty({
    description: 'First name of the user',
    example: 'Juan',
  })
  @IsString()
  firstName: string

  @ApiProperty({
    description: 'Last name of the user',
    example: 'Pérez',
  })
  @IsString()
  lastName: string

  @IsEnum(USER_ROLE)
  @IsNotEmpty({ message: 'role is required' })
  @ApiProperty({
    description: 'The role of the user',
    enum: USER_ROLE,
    example: USER_ROLE.ADMIN,
  })
  role: USER_ROLE
}
