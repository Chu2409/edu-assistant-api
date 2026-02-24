import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsIn, IsOptional, IsString } from 'class-validator'
import {
  VALID_RESPONSES_MODELS,
  VALID_EMBEDDINGS_MODELS,
  VALID_IMAGES_MODELS,
} from '../interfaces/models'

export class UpdateAiModelConfigDto {
  @ApiPropertyOptional({
    description: 'Modelo para Responses API (chat, generación de contenido)',
    example: 'gpt-5-mini',
    enum: VALID_RESPONSES_MODELS,
  })
  @IsOptional()
  @IsString()
  @IsIn(VALID_RESPONSES_MODELS, {
    message: `responses debe ser uno de: ${VALID_RESPONSES_MODELS.join(', ')}`,
  })
  responses?: (typeof VALID_RESPONSES_MODELS)[number]

  @ApiPropertyOptional({
    description: 'Modelo para Embeddings (búsqueda semántica, RAG)',
    example: 'text-embedding-3-small',
    enum: VALID_EMBEDDINGS_MODELS,
  })
  @IsOptional()
  @IsString()
  @IsIn(VALID_EMBEDDINGS_MODELS, {
    message: `embeddings debe ser uno de: ${VALID_EMBEDDINGS_MODELS.join(', ')}`,
  })
  embeddings?: (typeof VALID_EMBEDDINGS_MODELS)[number]

  @ApiPropertyOptional({
    description: 'Modelo para generación de imágenes',
    example: 'gpt-image-1-mini',
    enum: VALID_IMAGES_MODELS,
  })
  @IsOptional()
  @IsString()
  @IsIn(VALID_IMAGES_MODELS, {
    message: `images debe ser uno de: ${VALID_IMAGES_MODELS.join(', ')}`,
  })
  images?: (typeof VALID_IMAGES_MODELS)[number]
}

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

/** DTO de respuesta con lista de modelos disponibles para un escenario */
export class AvailableModelsResponseDto {
  @ApiProperty({
    description: 'Lista de modelos disponibles',
    type: [String],
    example: ['gpt-5-mini', 'gpt-5', 'gpt-4o'],
  })
  models: string[]
}
