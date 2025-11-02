import {
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator'
import { CreatePersonReqDto } from 'src/modules/people/dto/req/create-person.dto'
import { Type } from 'class-transformer'
import { ApiProperty } from '@nestjs/swagger'
import { USER_TYPE } from '../../types/user-type.enum'
import { USER_STATUS } from '../../types/user-status.enum'
export class CreateUserReqDto {
  @IsString({ message: 'username must be a string' })
  @IsNotEmpty({ message: 'username is required' })
  @ApiProperty({
    description: 'The username of the user',
    example: 'johndoe',
  })
  username: string

  @IsString({ message: 'password must be a string' })
  @IsNotEmpty({ message: 'password is required' })
  @ApiProperty({
    description: 'The password of the user',
    example: 'password',
  })
  password: string

  @IsEnum(USER_TYPE)
  @IsNotEmpty({ message: 'type is required' })
  @ApiProperty({
    description: 'The type of the user',
    enum: USER_TYPE,
    example: USER_TYPE.ADMINISTRATOR,
  })
  type: USER_TYPE

  @IsEnum(USER_STATUS)
  @IsOptional()
  @ApiProperty({
    description: 'The status of the user',
    enum: USER_STATUS,
    example: USER_STATUS.ACTIVE,
  })
  status?: USER_STATUS

  @IsObject()
  @ValidateNested()
  @Type(() => CreatePersonReqDto)
  @ApiProperty({
    description: 'The person of the user',
    type: CreatePersonReqDto,
  })
  person: CreatePersonReqDto
}
