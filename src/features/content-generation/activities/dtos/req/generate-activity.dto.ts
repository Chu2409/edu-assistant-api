import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator'
import { ActivityType } from 'src/core/database/generated/enums'

export class GenerateActivityDto {
  @ApiProperty({
    description:
      'ID del objeto de aprendizaje a partir de la cual generar la actividad',
    example: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  learningObjectId: number

  @ApiProperty({
    enum: ActivityType,
    example: ActivityType.MULTIPLE_CHOICE,
    description: 'Tipo de actividad a generar',
  })
  @IsEnum(ActivityType)
  type: ActivityType

  @ApiPropertyOptional({
    description:
      'Idioma del resultado (sobrescribe la configuración del módulo si existe)',
    example: 'es',
    minLength: 2,
    maxLength: 10,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(10)
  language?: string

  @ApiPropertyOptional({
    description: 'Dificultad 1-5',
    example: 2,
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  difficulty?: number

  @ApiPropertyOptional({
    description: 'Instrucciones extra para la actividad',
    example: 'Que sea sobre el ejemplo de código del final.',
    minLength: 1,
    maxLength: 600,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(600)
  instructions?: string
}
