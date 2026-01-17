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

@Injectable()
export class ContentGenerationService {
  constructor(
    private readonly dbService: DBService,
    private readonly aiService: AIService,
    private readonly htmlProcessor: HtmlProcessorService,
  ) { }

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

    // 2. Construir prompt completo
    const language = aiConfig?.language || 'es'
    const moduleContext = aiConfig?.contextPrompt || ''
    const prompt = this.buildPrompt(
      dto.topic,
      language,
      moduleContext,
      dto.prompt,
    )
    const fullPrompt = this.finalizeFullPrompt(prompt)
    // 3. MOCK: Llamar AIService.generateContent() (devuelve HTML fake)
    const rawHtml = await this.aiService.generateContent(fullPrompt)

    return rawHtml
  }

  /**
   * Construye el prompt completo para la generación de contenido
   */
  private buildPrompt(
    topic: string,
    language: string,
    contextPrompt: string,
    prompt: string,
  ): string {
    // Solo estructuramos los datos crudos de la solicitud
    return `
  <idioma>
  ${language}
  </idioma>
  
  <tema_principal>
  ${topic}
  </tema_principal>
  
  <contexto_adicional>
  ${contextPrompt || 'No se proporcionó contexto.'}
  </contexto_adicional>
  
  <instruccion_especifica>
  ${prompt}
  </instruccion_especifica>
  `.trim()
  }

  private finalizeFullPrompt(rawPrompt: string): string {
    const systemInstruction = `
  ### ROL
  Actúa como un Experto en Diseño Instruccional. Tu objetivo es crear material educativo de alto valor, preciso y pedagógicamente estructurado.
  
  ### LINEAMIENTOS DE CALIDAD
  1. Estructura: Divide el contenido en secciones lógicas con títulos claros.
  2. Estilo: Usa Markdown (negritas para conceptos clave, listas para enumeraciones).
  3. Claridad: Explica conceptos complejos de forma sencilla pero profesional.
  4. Idioma: Responde estrictamente en el idioma indicado en los datos de entrada.
  
  ### INSTRUCCIONES DE FORMATO
  - No incluyas introducciones innecesarias como "Aquí tienes el contenido...".
  - Ve directamente al grano del material educativo.
  - Usa un formato de salida limpio y listo para ser publicado.
  
  ---
  DATOS DE LA SOLICITUD:
  ${rawPrompt}
  ---
  `.trim()

    return systemInstruction
  }

  /**
   * Extrae keywords simples del contenido (sin IA)
   */
  private extractKeywords(topic: string, html: string): string[] {
    // Remover tags HTML para extraer texto
    const textContent = html.replace(/<[^>]*>/g, ' ').toLowerCase()

    // Palabras comunes a excluir
    const stopWords = new Set([
      'el',
      'la',
      'de',
      'que',
      'y',
      'a',
      'en',
      'un',
      'ser',
      'se',
      'no',
      'haber',
      'por',
      'con',
      'su',
      'para',
      'como',
      'estar',
      'tener',
      'le',
      'lo',
      'todo',
      'pero',
      'más',
      'hacer',
      'o',
      'poder',
      'decir',
      'este',
      'ir',
      'otro',
      'ese',
      'la',
      'si',
      'me',
      'ya',
      'ver',
      'porque',
      'dar',
      'cuando',
      'él',
      'muy',
      'sin',
      'vez',
      'mucho',
      'saber',
      'qué',
      'sobre',
      'mi',
      'alguno',
      'mismo',
      'yo',
      'también',
      'hasta',
      'año',
      'dos',
      'querer',
      'entre',
      'así',
      'primero',
      'desde',
      'grande',
      'eso',
      'ni',
      'nos',
      'llegar',
      'pasar',
      'tiempo',
      'ella',
      'sí',
      'uno',
      'bien',
      'poco',
      'deber',
      'entonces',
      'poner',
      'cosa',
      'tanto',
      'hombre',
      'parecer',
      'nuestro',
      'tan',
      'donde',
      'ahora',
      'parte',
      'después',
      'vida',
      'quedar',
      'siempre',
      'creer',
      'hablar',
      'llevar',
      'dejar',
      'nada',
      'cada',
      'seguir',
      'menos',
      'nuevo',
      'encontrar',
      'algo',
      'solo',
      'mientras',
      'entrar',
      'trabajar',
      'jugar',
      'vivir',
      'conocer',
      'pensar',
      'salir',
      'tomar',
      'mismo',
      'cambiar',
      'empezar',
      'contar',
      'escribir',
      'perder',
      'comenzar',
      'pedir',
      'preguntar',
      'mirar',
      'tratar',
      'usar',
      'sentir',
      'volver',
      'acabar',
      'buscar',
      'existir',
      'encontrar',
      'entrar',
      'trabajar',
      'jugar',
      'vivir',
      'conocer',
      'pensar',
      'salir',
      'tomar',
      'cambiar',
      'empezar',
      'contar',
      'escribir',
      'perder',
      'comenzar',
      'pedir',
      'preguntar',
      'mirar',
      'tratar',
      'usar',
      'sentir',
      'volver',
      'acabar',
      'buscar',
      'existir',
    ])

    // Extraer palabras del texto
    const words = textContent
      .split(/\s+/)
      .filter((word) => word.length > 3 && !stopWords.has(word))

    // Contar frecuencia de palabras
    const wordCount = new Map<string, number>()
    words.forEach((word) => {
      wordCount.set(word, (wordCount.get(word) || 0) + 1)
    })

    // Ordenar por frecuencia y tomar las top 10
    const sortedWords = Array.from(wordCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word)

    // Incluir el topic siempre
    const keywords = [topic.toLowerCase(), ...sortedWords]
    return Array.from(new Set(keywords)).slice(0, 10)
  }

  /**
   * Cuenta las palabras en el HTML (sin tags)
   */
  private countWords(html: string): number {
    const textContent = html.replace(/<[^>]*>/g, ' ')
    const words = textContent
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0)
    return words.length
  }
}
