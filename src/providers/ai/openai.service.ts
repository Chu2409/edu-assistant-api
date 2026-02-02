import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import OpenAI from 'openai'
import { CustomConfigService } from 'src/core/config/config.service'
import { PromptInput } from '../../features/pages/content-generation/interfaces/prompt-input.interface'
import { AiResponseDto } from './dtos/ai-response.interface'

@Injectable()
export class OpenaiService implements OnModuleInit {
  private openai: OpenAI
  private readonly logger = new Logger(OpenaiService.name)

  constructor(private customConfigService: CustomConfigService) {}

  onModuleInit() {
    // Inicializamos el cliente con la API Key
    this.openai = new OpenAI({
      apiKey: this.customConfigService.env.OPENAI_API_KEY,
    })
  }

  // 1. RESPONSES API (La nueva forma de Chat)
  // Maneja estado, multimodalidad y herramientas nativas.
  async getResponse<T>(
    input: PromptInput[],
    previousResponseId?: string,
  ): Promise<AiResponseDto<T>> {
    try {
      const response = await this.openai.responses.create({
        model: 'gpt-5-mini',
        // En Responses API, usamos 'input' en lugar de 'messages'
        input,
        // CLAVE: Si pasas el ID anterior, OpenAI recuerda el contexto automáticamente.
        previous_response_id: previousResponseId,
        // temperature: 0.8,
      })

      const content = JSON.parse(response.output_text)

      return {
        content,
        responseId: response.id,
      }
    } catch (error) {
      this.handleError(error)
    }
  }

  // 2. EMBEDDINGS API
  // Se mantiene igual, ideal para RAG (búsqueda semántica)
  async getEmbedding(text: string) {
    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text,
      })
      return response.data[0].embedding
    } catch (error) {
      this.handleError(error)
    }
  }

  // 3. IMAGES API (DALL-E 3)
  // Generación de imágenes
  async generateImage(prompt: string): Promise<string> {
    try {
      const response = await this.openai.images.generate({
        model: 'gpt-image-1-mini',
        prompt,
        n: 1,
        size: '1024x1024',
      })
      if (!response.data || response.data.length === 0) {
        throw new Error('No image data returned from OpenAI')
      }
      const b64Json = response.data[0].b64_json
      if (!b64Json) {
        throw new Error('No base64 JSON data returned from OpenAI')
      }
      return b64Json
    } catch (error) {
      this.handleError(error)
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private handleError(error: any): never {
    this.logger.error('OpenAI Error:', error)
    throw new Error('Error en la comunicación con OpenAI')
  }
}
