import { Injectable } from '@nestjs/common'

export interface ConceptToEmbed {
  term: string
  definition: string
  htmlId: string
}

@Injectable()
export class HtmlProcessorService {
  /**
   * Incrusta conceptos en el HTML reemplazando las menciones del término
   * con elementos interactivos que incluyen tooltips o popovers
   */
  embedConcepts(html: string, concepts: ConceptToEmbed[]): string {
    let processedHtml = html

    // Para cada concepto, buscar y reemplazar menciones del término
    concepts.forEach((concept) => {
      // Crear un regex que busque el término como palabra completa (case insensitive)
      const regex = new RegExp(`\\b${this.escapeRegex(concept.term)}\\b`, 'gi')

      // Reemplazar cada mención con un span interactivo
      processedHtml = processedHtml.replace(
        regex,
        `<span id="${concept.htmlId}" class="concept-term" data-term="${this.escapeHtml(concept.term)}" data-definition="${this.escapeHtml(concept.definition)}" title="${this.escapeHtml(concept.definition)}">${concept.term}</span>`,
      )
    })

    return processedHtml
  }

  /**
   * Escapa caracteres especiales para regex
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  /**
   * Escapa caracteres HTML para prevenir XSS
   */
  private escapeHtml(str: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      // eslint-disable-next-line prettier/prettier
      '\'': '&#039;',
    }
    return str.replace(/[&<>"']/g, (m) => map[m])
  }
}
