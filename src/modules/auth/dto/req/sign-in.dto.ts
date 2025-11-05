import { ApiProperty } from '@nestjs/swagger'
import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator'

export class SignInReqDto {
  @ApiProperty({
    description: 'email',
    example: 'jperez1231@uta.edu.ec',
  })
  @IsEmail()
  @IsNotEmpty({ message: 'email must not be empty' })
  email: string

  @ApiProperty({
    description: 'password',
    example: '123456',
  })
  @IsString({ message: 'password must be a string' })
  @Length(6, 20, { message: 'password must be between 4 and 20 characters' })
  password: string
}
