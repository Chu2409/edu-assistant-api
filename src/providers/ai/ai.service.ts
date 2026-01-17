import { Injectable } from '@nestjs/common'
import { Concept } from './interfaces/concept.interface'

@Injectable()
export class AIService {
  /**
   * MOCK: Genera contenido HTML fake basado en el prompt
   */
  async generateContent(prompt: string): Promise<string> {
    // Simular delay de API
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // HTML fake generado
    return `
      <div>
        <h1>Contenido Generado</h1>
        <p>Este es un contenido de ejemplo generado por IA. El contenido incluye información relevante sobre el tema solicitado.</p>
        <p>Aquí hay más información detallada sobre el tema. El contenido está estructurado de manera educativa y clara.</p>
        <h2>Sección Importante</h2>
        <p>Esta sección contiene información adicional que complementa el contenido principal.</p>
        <ul>
          <li>Punto clave número uno</li>
          <li>Punto clave número dos</li>
          <li>Punto clave número tres</li>
        </ul>
        <p>En conclusión, este contenido proporciona una visión completa del tema tratado.</p>
      </div>
    `.trim()
  }

  /**
   * MOCK: Extrae conceptos fake del contenido
   */
  async extractConcepts(content: string): Promise<Concept[]> {
    // Simular delay de API
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Conceptos fake extraídos
    return [
      {
        term: 'Concepto Principal',
        definition:
          'Definición del concepto principal extraído del contenido generado.',
      },
      {
        term: 'Concepto Secundario',
        definition:
          'Definición del concepto secundario relacionado con el tema.',
      },
      {
        term: 'Término Técnico',
        definition:
          'Explicación del término técnico mencionado en el contenido.',
      },
    ]
  }

  /**
   * MOCK: Genera un embedding vector fake
   */
  async generateEmbedding(content: string): Promise<number[]> {
    // Simular delay de generación de embedding
    await new Promise((resolve) => setTimeout(resolve, 300))

    // Vector fake de 1536 dimensiones (tamaño estándar para OpenAI embeddings)
    return Array.from({ length: 1536 }, () => Math.random())
  }
}
