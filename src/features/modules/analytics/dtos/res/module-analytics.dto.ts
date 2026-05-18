import { ApiProperty } from '@nestjs/swagger'

export class LoAnalyticsDto {
  @ApiProperty({
    description: 'ID del Objeto de Aprendizaje',
    example: 1,
  })
  id: number

  @ApiProperty({
    description: 'Título del Objeto de Aprendizaje',
    example: 'Introducción al Álgebra',
  })
  title: string

  @ApiProperty({
    description: 'Índice de orden del Objeto de Aprendizaje',
    example: 0,
  })
  orderIndex: number

  @ApiProperty({
    description: 'Número de estudiantes únicos que han visto el contenido',
    example: 50,
  })
  uniqueViews: number

  @ApiProperty({
    description:
      'Número de estudiantes que han completado el Objeto de Aprendizaje',
    example: 40,
  })
  completions: number

  @ApiProperty({
    description:
      'Porcentaje de estudiantes que completaron el Objeto de Aprendizaje',
    example: 80,
  })
  completionRate: number

  @ApiProperty({
    description: 'Número de estudiantes únicos que intentaron actividades',
    example: 45,
  })
  activityEngagement: number

  @ApiProperty({
    description: 'Porcentaje de abandono entre visitas e intentos de actividad',
    example: 10,
  })
  dropOffRate: number

  @ApiProperty({
    description: 'Comentarios cualitativos de los estudiantes',
    type: [String],
    example: ['¡Gran contenido!', 'Un poco confuso al final.'],
  })
  feedbacks: string[]
}

export class ModuleAnalyticsDto {
  @ApiProperty({
    description: 'ID del módulo',
    example: 1,
  })
  moduleId: number

  @ApiProperty({
    description: 'Número total de estudiantes inscritos activos en el módulo',
    example: 100,
  })
  totalStudents: number

  @ApiProperty({
    description: 'Métricas detalladas por cada Objeto de Aprendizaje',
    type: [LoAnalyticsDto],
  })
  loAnalytics: LoAnalyticsDto[]
}
