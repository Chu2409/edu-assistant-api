import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common'
import { DBService } from 'src/core/database/database.service'
import { HtmlProcessorService } from './html-processor.service'
import { GenerateContentDto } from './dtos/req/generate-content.dto'
import { type User } from 'src/core/database/generated/client'
import { AIService } from 'src/providers/ai/ai.service'
import { OpenaiService } from 'src/providers/ai/openai.service'
import { generateLessonMessages } from 'src/providers/ai/messages-format'

@Injectable()
export class ContentGenerationService {
  constructor(
    private readonly dbService: DBService,
    private readonly aiService: AIService,
    private readonly htmlProcessor: HtmlProcessorService,
    private readonly openAiService: OpenaiService,
  ) {}

  async generateContent(dto: GenerateContentDto, user: User) {
    // 1. Obtener AiConfiguration del módulo
    const module = await this.dbService.module.findUnique({
      where: { id: dto.moduleId },
      include: {
        aiConfiguration: true,
      },
    })

    if (!module) {
      throw new NotFoundException(`Módulo con ID ${dto.moduleId} no encontrado`)
    }

    // Verificar que el usuario es el profesor propietario
    if (module.teacherId !== user.id) {
      throw new ForbiddenException(
        'Solo el profesor propietario puede generar contenido para este módulo',
      )
    }

    const aiConfig = module.aiConfiguration
    if (!aiConfig) {
      throw new NotFoundException(
        `Configuración de IA no encontrada para el módulo ${dto.moduleId}`,
      )
    }

    const prompt = generateLessonMessages({ ...aiConfig, title: dto.topic })
    // 3. MOCK: Llamar AIService.generateContent() (devuelve HTML fake)
    const rawHtml = await this.openAiService.getResponse(prompt)

    return rawHtml
  }
}
