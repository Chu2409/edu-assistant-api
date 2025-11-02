import { ApiPropertyOptional, PartialType } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsString, IsOptional, IsEmail, IsDate } from 'class-validator'
import { CreatePersonReqDto } from './create-person.dto'

export class UpdatePersonReqDto extends PartialType(CreatePersonReqDto) {
  @ApiPropertyOptional({
    description: 'DNI de la persona',
    example: '0707047643',
  })
  @IsString()
  @IsOptional()
  dni?: string

  @ApiPropertyOptional({
    description: 'Nombre de la persona',
    example: 'Juan',
  })
  @IsString()
  @IsOptional()
  name?: string

  @ApiPropertyOptional({
    description: 'Apellido de la persona',
    example: 'Pérez',
  })
  @IsString()
  @IsOptional()
  surname?: string

  @ApiPropertyOptional({
    description: 'Email de la persona',
    example: 'jperez1231@uta.edu.ec',
  })
  @IsEmail()
  @IsOptional()
  email?: string

  @ApiPropertyOptional({
    description: 'Fecha de nacimiento de la persona',
    example: '1990-01-01',
  })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  birthDate?: Date

  @ApiPropertyOptional({
    description: 'Teléfono de la persona',
    example: '0987654321',
  })
  @IsOptional()
  @IsString()
  phone?: string
}
