import {
  ApiProperty,
  ApiPropertyOptional,
  getSchemaPath,
} from '@nestjs/swagger'
import { Type } from 'class-transformer'
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator'
import { ActivityType } from 'src/core/database/generated/enums'
import {
  type AiGeneratedActivity,
  AiGeneratedFillBlankActivity,
  AiGeneratedMatchActivity,
  AiGeneratedMultipleChoiceActivity,
  AiGeneratedTrueFalseActivity,
} from 'src/features/pages/content-generation/interfaces/ai-generated-activity.interface'

export class CreateActivityDto {
  @ApiProperty({ enum: ActivityType, example: ActivityType.TRUE_FALSE })
  @IsEnum(ActivityType)
  type: ActivityType

  @ApiProperty({
    description: 'Enunciado/pregunta',
    example: '¿La respiración celular ocurre en las mitocondrias?',
  })
  @IsString()
  @MinLength(1)
  question: string

  @ApiPropertyOptional({
    description:
      'Opciones (depende del tipo). Para MULTIPLE_CHOICE/MATCH normalmente va aquí.',
    oneOf: [
      { $ref: getSchemaPath(AiGeneratedMultipleChoiceActivity) },
      { $ref: getSchemaPath(AiGeneratedTrueFalseActivity) },
      { $ref: getSchemaPath(AiGeneratedFillBlankActivity) },
      { $ref: getSchemaPath(AiGeneratedMatchActivity) },
    ],
  })
  @IsObject()
  @IsNotEmpty()
  options: AiGeneratedActivity

  @ApiPropertyOptional({
    description: 'Explicación de la respuesta',
    example: 'Ocurre principalmente en la mitocondria.',
  })
  @IsOptional()
  @IsString()
  explanation?: string | null

  @ApiPropertyOptional({ description: 'Dificultad 1-5', example: 2 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  difficulty?: number

  @ApiPropertyOptional({
    description: 'Aprobada por el profesor',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isApprovedByTeacher?: boolean
}
