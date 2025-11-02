import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsDate, IsEmail, IsOptional, IsString } from 'class-validator'

export class CreatePersonReqDto {
  @ApiProperty({
    description: 'Person dni (must be unique)',
    example: '0707047643',
  })
  @IsString()
  dni: string

  @ApiProperty({
    description: 'Person name',
    example: 'Juan',
  })
  @IsString()
  name: string

  @ApiProperty({
    description: 'Person surname',
    example: 'Pérez',
  })
  @IsString()
  surname: string

  @ApiProperty({
    description: 'Email of the person (must be unique)',
    example: 'jperez1231@uta.edu.ec',
  })
  @IsEmail()
  email: string

  @ApiPropertyOptional({
    description: 'Birth date of the person',
    example: '1990-01-01',
  })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  birthDate?: Date

  @ApiPropertyOptional({
    description: 'Phone number of the person',
    example: '0987654321',
  })
  @IsOptional()
  @IsString()
  phone?: string
}
