import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class LoTypeDto {
  @ApiProperty({
    description: 'ID del tipo de objeto de aprendizaje',
    example: 1,
  })
  id: number

  @ApiProperty({
    description: 'Nombre del tipo',
    example: 'LECTURA',
  })
  name: string

  @ApiPropertyOptional({
    description: 'Descripción del tipo',
    example: 'Contenido teórico y lecturas',
    nullable: true,
  })
  description: string | null
}
