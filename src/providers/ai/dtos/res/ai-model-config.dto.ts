import { ApiProperty } from '@nestjs/swagger'
import {
  VALID_RESPONSES_MODELS,
  VALID_EMBEDDINGS_MODELS,
  VALID_IMAGES_MODELS,
} from '../../constants/models'

/** DTO de respuesta para la configuración de modelos de IA */
export class AiModelConfigResponseDto {
  @ApiProperty({
    description: 'Modelo para Responses API (chat, generación de contenido)',
    example: 'gpt-5-mini',
    enum: VALID_RESPONSES_MODELS,
  })
  responses: (typeof VALID_RESPONSES_MODELS)[number]

  @ApiProperty({
    description: 'Modelo para Embeddings (búsqueda semántica, RAG)',
    example: 'text-embedding-3-small',
    enum: VALID_EMBEDDINGS_MODELS,
  })
  embeddings: (typeof VALID_EMBEDDINGS_MODELS)[number]

  @ApiProperty({
    description: 'Modelo para generación de imágenes',
    example: 'gpt-image-1-mini',
    enum: VALID_IMAGES_MODELS,
  })
  images: (typeof VALID_IMAGES_MODELS)[number]
}
