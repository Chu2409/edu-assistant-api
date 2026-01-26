import { Injectable, OnModuleInit } from '@nestjs/common'
import OpenAI from 'openai'
import { CustomConfigService } from 'src/core/config/config.service'
import { PromptInput } from '../../features/pages/content-generation/interfaces/prompt-input.interface'

@Injectable()
export class OpenaiService implements OnModuleInit {
  private openai: OpenAI

  constructor(private customConfigService: CustomConfigService) {}

  onModuleInit() {
    // Inicializamos el cliente con la API Key
    this.openai = new OpenAI({
      apiKey: this.customConfigService.env.OPENAI_API_KEY,
    })
  }

  // 1. RESPONSES API (La nueva forma de Chat)
  // Maneja estado, multimodalidad y herramientas nativas.
  async getResponse(input: PromptInput[], previousResponseId?: string) {
    try {
      const response = await this.openai.responses.create({
        model: 'gpt-4.1-mini',
        // En Responses API, usamos 'input' en lugar de 'messages'
        input,
        // CLAVE: Si pasas el ID anterior, OpenAI recuerda el contexto automáticamente.
        previous_response_id: previousResponseId,
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
  async generateImage(prompt: string) {
    try {
      const response = await this.openai.images.generate({
        model: 'gpt-image-1',
        prompt,
        n: 1,
        size: '1024x1024',
      })
      if (!response.data || response.data.length === 0) {
        throw new Error('No image data returned from OpenAI')
      }
      return response.data[0].url
    } catch (error) {
      this.handleError(error)
    }
  }

  private handleError(error: any) {
    console.error('OpenAI Error:', error)
    throw new Error('Error en la comunicación con OpenAI')
  }
}
