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
  Max,
  Min,
} from 'class-validator'
import { ActivityType } from 'src/core/database/generated/enums'
import {
  type AiGeneratedActivity,
  AiFillBlankActivity,
  AiGeneratedMatchActivity,
  AiMultipleChoiceActivity,
  AiTrueFalseActivity,
} from 'src/features/content-generation/activities/interfaces/ai-generated-activity.interface'

export class CreateActivityDto {
  @ApiProperty({ enum: ActivityType, example: ActivityType.TRUE_FALSE })
  @IsEnum(ActivityType)
  type: ActivityType

  @ApiProperty({
    description:
      'Opciones (depende del tipo). Para MULTIPLE_CHOICE/MATCH normalmente va aquí.',
    oneOf: [
      { $ref: getSchemaPath(AiMultipleChoiceActivity) },
      { $ref: getSchemaPath(AiTrueFalseActivity) },
      { $ref: getSchemaPath(AiFillBlankActivity) },
      { $ref: getSchemaPath(AiGeneratedMatchActivity) },
    ],
  })
  @IsObject()
  @IsNotEmpty()
  options: AiGeneratedActivity

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
