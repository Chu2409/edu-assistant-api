import { ApiPropertyOptional, getSchemaPath } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  Max,
  Min,
} from 'class-validator'
import { ActivityType } from 'src/core/database/generated/enums'
import {
  AiFillBlankActivity,
  type AiGeneratedActivity,
  AiGeneratedMatchActivity,
  AiMultipleChoiceActivity,
  AiTrueFalseActivity,
} from 'src/features/content-generation/activities/interfaces/ai-generated-activity.interface'

export class UpdateActivityDto {
  @ApiPropertyOptional({ enum: ActivityType })
  @IsOptional()
  @IsEnum(ActivityType)
  type?: ActivityType

  @ApiPropertyOptional({
    description:
      'Opciones (depende del tipo). Para MULTIPLE_CHOICE/MATCH normalmente va aquí.',
    oneOf: [
      { $ref: getSchemaPath(AiMultipleChoiceActivity) },
      { $ref: getSchemaPath(AiTrueFalseActivity) },
      { $ref: getSchemaPath(AiFillBlankActivity) },
      { $ref: getSchemaPath(AiGeneratedMatchActivity) },
    ],
  })
  @IsOptional()
  @IsObject()
  options?: AiGeneratedActivity

  @ApiPropertyOptional({ description: 'Dificultad 1-5' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  difficulty?: number

  @ApiPropertyOptional({ description: 'Aprobada por el profesor' })
  @IsOptional()
  @IsBoolean()
  isApprovedByTeacher?: boolean

  @ApiPropertyOptional({ description: 'Usada como ejemplo' })
  @IsOptional()
  @IsBoolean()
  usedAsExample?: boolean
}
