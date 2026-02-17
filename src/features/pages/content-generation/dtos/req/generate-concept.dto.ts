import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsInt, IsOptional, IsString, Min } from 'class-validator'

export class GenerateConceptDto {
  @ApiProperty({
    description: 'Texto del término seleccionado para generar su definición',
    example: 'Polimorfismo',
  })
  @IsString()
  selectedText: string

  @ApiProperty({
    description:
      'ID del bloque de texto seleccionado para generar su definición',
    example: 1,
  })
  @IsInt()
  @Min(1)
  blockId: number

  @ApiPropertyOptional({
    description: 'Idioma de la definición',
    example: 'es',
    default: 'es',
  })
  @IsOptional()
  @IsString()
  language?: string
}
