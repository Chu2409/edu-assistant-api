import { ApiProperty } from '@nestjs/swagger'
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator'

export class CreateStudentQuestionDto {
  @ApiProperty({
    description: 'El ID de la página a la que pertenece la pregunta',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  pageId: number

  @ApiProperty({
    description: 'La pregunta del estudiante',
    example: '¿Qué es la programación?',
  })
  @IsString()
  @IsNotEmpty()
  question: string

  @ApiProperty({
    description: 'Indica si la pregunta es pública (visible en el foro)',
    example: true,
    required: false,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean
}
