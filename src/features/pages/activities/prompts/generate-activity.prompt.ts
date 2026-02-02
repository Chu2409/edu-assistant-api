import { ActivityType } from 'src/core/database/generated/enums'
import type { PromptInput } from '../../content-generation/interfaces/prompt-input.interface'

export interface GenerateActivityPromptInput {
  type: ActivityType
  language: string
  difficulty: number
  lessonTitle: string
  lessonContext: string
  instructions?: string
}

export const generateActivityPrompt = (
  input: GenerateActivityPromptInput,
): PromptInput[] => {
  const {
    type,
    language,
    difficulty,
    lessonTitle,
    lessonContext,
    instructions,
  } = input

  const system = `Eres un experto en evaluación educativa. Debes generar UNA sola actividad (reactivo) basada estrictamente en la lección.

Responde en idioma: ${language}.

# FORMATO DE SALIDA (OBLIGATORIO)
Devuelve SOLO JSON válido, sin fences ni texto extra.

El JSON debe tener exactamente esta forma:
{
  "type": "${type}",
  "difficulty": number,
  "question": string,
  "options": object | null,
  "correctAnswer": object,
  "explanation": string | null
}

# CONTRATOS POR TIPO (CRÍTICO)

## MULTIPLE_CHOICE
- options:
  { "options": [ { "id": "A" | "B" | "C" | "D", "text": string } ] }
- correctAnswer:
  { "optionId": "A" | "B" | "C" | "D" }

## TRUE_FALSE
- options: null
- correctAnswer:
  { "value": true | false }

## FILL_BLANK
- La pregunta debe indicar el/los espacios en blanco usando "____".
- options: null
- correctAnswer:
  { "answers": string[] }
  (mismo número de respuestas que blanks; respuestas cortas)

## MATCH
- options:
  { "pairs": [ { "left": string, "right": string } ] }
- correctAnswer:
  { "pairs": [ { "left": string, "right": string } ] }
  (debe coincidir con options.pairs exactamente)

# REGLAS
- Dificultad 1-5: usa ${difficulty}.
- No uses información que no esté en el contexto de la lección.
- La explicación debe justificar la respuesta correcta en 1-3 frases (o null si no aplica).`

  const user = `Lección: ${lessonTitle}

# CONTEXTO DE LA LECCIÓN
${lessonContext || '(sin contenido disponible)'}

# PARÁMETROS
Tipo: ${type}
Dificultad: ${difficulty}
${instructions ? `Instrucciones extra: ${instructions}` : ''}

Genera UNA actividad del tipo solicitado.`

  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ]
}
