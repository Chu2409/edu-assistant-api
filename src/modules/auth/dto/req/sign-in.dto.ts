import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString, Length } from 'class-validator'

export class SignInReqDto {
  @ApiProperty({
    description: 'username',
    example: 'chu2409',
  })
  @IsString({ message: 'username must be a string' })
  @IsNotEmpty({ message: 'username must not be empty' })
  username: string

  @ApiProperty({
    description: 'password',
    example: '123456',
  })
  @IsString({ message: 'password must be a string' })
  @Length(6, 20, { message: 'password must be between 4 and 20 characters' })
  password: string
}
