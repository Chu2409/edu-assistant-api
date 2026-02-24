import { Body, Controller, Get, HttpStatus, Patch } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { OpenaiService, type AiModelConfig } from './openai.service'
import {
  UpdateAiModelConfigDto,
  AiModelConfigResponseDto,
  AvailableModelsResponseDto,
} from './dtos/ai-model-config.dto'
import { ApiStandardResponse } from 'src/shared/decorators/api-standard-response.decorator'
import { JwtAuth } from 'src/features/auth/decorators/jwt-auth.decorator'
import { Role } from 'src/core/database/generated/client'
import {
  VALID_RESPONSES_MODELS,
  VALID_EMBEDDINGS_MODELS,
  VALID_IMAGES_MODELS,
} from './interfaces/models'

@ApiTags('AI Config')
@Controller('ai/config')
@JwtAuth(Role.TEACHER)
export class AiConfigController {
  constructor(private readonly openaiService: OpenaiService) {}

  @Get()
  @ApiOperation({
    summary: 'Obtener configuración actual de modelos',
    description:
      'Devuelve los modelos configurados para Responses, Embeddings e Imágenes. La configuración se mantiene en memoria (se pierde al reiniciar).',
  })
  @ApiStandardResponse(AiModelConfigResponseDto)
  getConfig() {
    return this.openaiService.getModelConfig()
  }

  @Get('models/responses')
  @ApiOperation({
    summary: 'Modelos disponibles para Responses',
    description:
      'Lista de modelos válidos para chat, generación de contenido y respuestas con IA.',
  })
  @ApiStandardResponse(AvailableModelsResponseDto)
  getAvailableResponsesModels() {
    return { models: [...VALID_RESPONSES_MODELS] }
  }

  @Get('models/embeddings')
  @ApiOperation({
    summary: 'Modelos disponibles para Embeddings',
    description:
      'Lista de modelos válidos para embeddings, búsqueda semántica y RAG.',
  })
  @ApiStandardResponse(AvailableModelsResponseDto)
  getAvailableEmbeddingsModels() {
    return { models: [...VALID_EMBEDDINGS_MODELS] }
  }

  @Get('models/images')
  @ApiOperation({
    summary: 'Modelos disponibles para imágenes',
    description: 'Lista de modelos válidos para generación de imágenes con IA.',
  })
  @ApiStandardResponse(AvailableModelsResponseDto)
  getAvailableImagesModels() {
    return { models: [...VALID_IMAGES_MODELS] }
  }

  @Patch()
  @ApiOperation({
    summary: 'Configurar modelos de IA',
    description:
      'Actualiza los modelos usados para generación de contenido. Solo se envían los campos que se desean cambiar. La configuración se mantiene en memoria (se pierde al reiniciar).',
  })
  @ApiStandardResponse(AiModelConfigResponseDto, HttpStatus.OK)
  updateConfig(@Body() dto: UpdateAiModelConfigDto) {
    const config: Partial<AiModelConfig> = {}
    if (dto.responses) config.responses = dto.responses as AiModelConfig['responses']
    if (dto.embeddings) config.embeddings = dto.embeddings as AiModelConfig['embeddings']
    if (dto.images) config.images = dto.images as AiModelConfig['images']
    return this.openaiService.setModelConfig(config)
  }
}
