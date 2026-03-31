import { EmbeddingsModel, ImagesModel, ResponsesModel } from './models'

export interface AiModelConfig {
  responses: ResponsesModel
  embeddings: EmbeddingsModel
  images: ImagesModel
}
