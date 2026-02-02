import { RelationType } from 'src/core/database/generated/enums'
import type { PromptInput } from '../../content-generation/interfaces/prompt-input.interface'

export interface SuggestPageRelationsPromptInput {
  language: string
  originTitle: string
  originBlocks: Array<{ blockId: number; markdown: string }>
  candidates: Array<{ relatedPageId: number; relatedPageTitle: string }>
  allowedRelationTypes?: RelationType[]
}

export const suggestPageRelationsPrompt = (
  input: SuggestPageRelationsPromptInput,
): PromptInput[] => {
  const {
    language,
    originTitle,
    originBlocks,
    candidates,
    allowedRelationTypes,
  } = input

  const allowed = (
    allowedRelationTypes?.length
      ? allowedRelationTypes
      : Object.values(RelationType)
  ).join(' | ')

  const system = `Eres un experto en diseño instruccional. Debes clasificar relaciones entre lecciones y proponer anclas dentro del contenido de la lección origen.

Responde en idioma: ${language}.

# FORMATO DE SALIDA (OBLIGATORIO)
Devuelve SOLO JSON válido (sin fences ni texto extra):
{
  "suggestions": [
    {
      "relatedPageId": number,
      "relationType": "${allowed}",
      "anchors": [
        { "blockId": number, "mentionText": string }
      ],
      "explanation": string
    }
  ]
}

# REGLAS CRÍTICAS
- Debes devolver una entrada por cada candidate relatedPageId.
- anchors: 1-3 anclas máximo por sugerencia.
- mentionText DEBE aparecer VERBATIM (exactamente) en el markdown del bloque indicado.
- blockId debe ser uno de los bloques proporcionados.
- relationType debe ser uno de los permitidos.
- explanation: 1-2 frases, explica por qué la página relacionada es útil.`

  const blocksText = originBlocks
    .map(
      (b, idx) => `## Block ${idx + 1} (blockId=${b.blockId})\n${b.markdown}\n`,
    )
    .join('\n')

  const candText = candidates
    .map((c) => `- ${c.relatedPageId}: ${c.relatedPageTitle}`)
    .join('\n')

  const user = `Lección origen: ${originTitle}

# BLOQUES DE LA LECCIÓN ORIGEN (markdown)
${blocksText || '(sin bloques)'}

# CANDIDATAS
${candText}

Devuelve JSON con suggestions para TODAS las candidatas.`

  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ]
}
