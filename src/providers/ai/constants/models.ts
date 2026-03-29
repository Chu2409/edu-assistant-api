import { AiModelConfig } from '../interfaces/ai-model-config'
import {
  EmbeddingsModel,
  ImagesModel,
  ResponsesModel,
} from '../interfaces/models'

export const VALID_RESPONSES_MODELS = [
  'gpt-5.2',
  'gpt-5.1',
  'gpt-5.1-mini',
  'gpt-5',
  'gpt-5-mini',
  'gpt-5-nano',
  'gpt-4.1',
  'gpt-4.1-mini',
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-4-turbo',
  'gpt-4',
  'gpt-3.5-turbo',
  'o4-mini',
  'o3',
  'o3-mini',
  'o1',
  'o1-mini',
] as const satisfies readonly ResponsesModel[]

export const VALID_EMBEDDINGS_MODELS = [
  'text-embedding-ada-002',
  'text-embedding-3-small',
  'text-embedding-3-large',
] as const satisfies readonly EmbeddingsModel[]

export const VALID_IMAGES_MODELS = [
  'gpt-image-1.5',
  'gpt-image-1',
  'gpt-image-1-mini',
  'dall-e-2',
  'dall-e-3',
] as const satisfies readonly ImagesModel[]

export const DEFAULT_MODELS: AiModelConfig = {
  responses: 'gpt-5-mini',
  embeddings: 'text-embedding-3-small',
  images: 'gpt-image-1-mini',
}
