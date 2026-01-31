import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsInt,
  ValidateIf,
} from 'class-validator'
import { BlockType } from 'src/core/database/generated/client'

export class UpsertBlockDto {
  @ApiPropertyOptional({
    description:
      'ID del bloque (si existe, se actualiza; si no, se crea uno nuevo)',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  id?: number

  @ApiProperty({
    description: 'Tipo de bloque',
    enum: BlockType,
    example: BlockType.TEXT,
  })
  @IsEnum(BlockType)
  @IsNotEmpty()
  type: BlockType

  @ApiProperty({
    description: 'Contenido del bloque en formato JSON',
    example: { text: 'Este es el contenido del bloque' },
  })
  @IsObject()
  @IsNotEmpty()
  content: Record<string, any>

  @ApiPropertyOptional({
    description: 'Contenido TipTap en formato JSON (opcional)',
    example: { type: 'doc', content: [] },
  })
  @IsOptional()
  @IsObject()
  @ValidateIf((o) => o.tipTapContent !== null)
  tipTapContent?: Record<string, any> | null
}
