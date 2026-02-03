import { ApiProperty } from '@nestjs/swagger'

export class AiGeneratedMultipleChoiceActivity {
  @ApiProperty({ example: '¿Cuál es la mejor definición de X?' })
  question: string

  @ApiProperty({
    type: [String],
    example: ['Opción A', 'Opción B', 'Opción C', 'Opción D'],
    description: 'Exactamente 4 opciones',
  })
  options: string[]

  @ApiProperty({
    example: 0,
    minimum: 0,
    maximum: 3,
    description: 'Índice 0-based (0-3) de la opción correcta',
  })
  correctAnswer: number

  @ApiProperty({ example: 'Porque ...' })
  explanation: string
}

export class AiGeneratedTrueFalseActivity {
  @ApiProperty({ example: 'El ADN es una doble hélice.' })
  statement: string

  @ApiProperty({ example: true })
  correctAnswer: boolean

  @ApiProperty({ example: 'Porque ...' })
  explanation: string
}

export class AiGeneratedFillBlankActivity {
  @ApiProperty({
    example: 'La ___ es responsable de producir ATP.',
    description: 'Debe usar "___" para marcar el espacio en blanco',
  })
  sentence: string

  @ApiProperty({ example: 'mitocondria' })
  correctAnswer: string

  @ApiProperty({
    type: [String],
    example: ['mitocondria', 'mitochondria'],
    description: 'Variaciones aceptables (1-3 máximo)',
  })
  acceptableAnswers: string[]

  @ApiProperty({ example: 'Porque ...' })
  explanation: string
}

export class AiGeneratedMatchPair {
  @ApiProperty({ example: 'Término 1' })
  left: string

  @ApiProperty({ example: 'Definición 1' })
  right: string
}

export class AiGeneratedMatchActivity {
  @ApiProperty({ example: 'Match each term with its definition' })
  instructions: string

  @ApiProperty({ type: [AiGeneratedMatchPair] })
  pairs: AiGeneratedMatchPair[]
}

export type AiGeneratedActivity =
  | AiGeneratedMultipleChoiceActivity
  | AiGeneratedTrueFalseActivity
  | AiGeneratedFillBlankActivity
  | AiGeneratedMatchActivity
