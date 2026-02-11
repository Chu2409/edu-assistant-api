import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { DBService } from 'src/core/database/database.service'
import { OpenaiService } from 'src/providers/ai/openai.service'
import { Block, Prisma, type User } from 'src/core/database/generated/client'
import { BlockType } from 'src/core/database/generated/enums'
import { BlocksMapper } from '../blocks/mappers/blocks.mapper'
import { CreatePageRelationDto } from './dtos/req/create-page-relation.dto'
import { UpdatePageRelationDto } from './dtos/req/update-page-relation.dto'
import { PageRelationDto } from './dtos/res/page-relation.dto'
import { PagesHelperService } from '../main/pages-helper.service'
import {
  AiCodeBlock,
  AiTextBlock,
} from '../content-generation/interfaces/ai-generated-content.interface'

type SimilarRow = { id: number; similarity: number }

@Injectable()
export class PageRelationsService {
  constructor(
    private readonly dbService: DBService,
    private readonly openAiService: OpenaiService,
    private readonly pagesHelperService: PagesHelperService,
  ) {}

  async create(
    pageId: number,
    dto: CreatePageRelationDto,
    user: User,
  ): Promise<PageRelationDto> {
    await this.pagesHelperService.getPageForWrite(pageId, user)

    const related = await this.dbService.page.findUnique({
      where: { id: dto.relatedPageId },
      select: { id: true, title: true, moduleId: true },
    })
    if (!related)
      throw new NotFoundException('Página relacionada no encontrada')

    const origin = await this.dbService.page.findUnique({
      where: { id: pageId },
      select: { moduleId: true },
    })
    if (!origin)
      throw new NotFoundException(`Página con ID ${pageId} no encontrada`)
    if (related.moduleId !== origin.moduleId) {
      throw new ForbiddenException(
        'La página relacionada debe pertenecer al mismo módulo',
      )
    }

    try {
      const created = await this.dbService.pageRelation.create({
        data: {
          originPageId: pageId,
          relatedPageId: dto.relatedPageId,
          similarityScore: dto.similarityScore ?? 0,
          relationType: dto.relationType,
          mentionText: dto.mentionText,
          explanation: dto.explanation ?? null,
          isEmbedded: dto.isEmbedded ?? false,
        },
        include: { relatedPage: { select: { id: true, title: true } } },
      })

      return {
        id: created.id,
        originPageId: created.originPageId,
        relatedPageId: created.relatedPageId,
        similarityScore: created.similarityScore,
        relationType: created.relationType,
        mentionText: created.mentionText,
        explanation: created.explanation ?? null,
        isEmbedded: created.isEmbedded,
        embeddedAt: created.embeddedAt ?? null,
        calculatedAt: created.calculatedAt,
        createdAt: created.createdAt,
        relatedPage: {
          id: created.relatedPage.id,
          title: created.relatedPage.title,
        },
      }
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ForbiddenException(
          'Ya existe una relación con esa página relacionada',
        )
      }
      throw e
    }
  }

  async update(
    pageId: number,
    relationId: number,
    dto: UpdatePageRelationDto,
    user: User,
  ): Promise<PageRelationDto> {
    await this.pagesHelperService.getPageForWrite(pageId, user)

    const existing = await this.dbService.pageRelation.findUnique({
      where: { id: relationId },
      include: { relatedPage: { select: { id: true, title: true } } },
    })
    if (!existing || existing.originPageId !== pageId) {
      throw new NotFoundException('Relación no encontrada')
    }

    const updated = await this.dbService.pageRelation.update({
      where: { id: relationId },
      data: {
        ...(dto.similarityScore !== undefined && {
          similarityScore: dto.similarityScore,
        }),
        ...(dto.relationType !== undefined && {
          relationType: dto.relationType,
        }),
        ...(dto.mentionText !== undefined && { mentionText: dto.mentionText }),
        ...(dto.explanation !== undefined && { explanation: dto.explanation }),
        ...(dto.isEmbedded !== undefined && {
          isEmbedded: dto.isEmbedded,
          embeddedAt: dto.isEmbedded ? new Date() : null,
        }),
      },
      include: { relatedPage: { select: { id: true, title: true } } },
    })

    return {
      id: updated.id,
      originPageId: updated.originPageId,
      relatedPageId: updated.relatedPageId,
      similarityScore: updated.similarityScore,
      relationType: updated.relationType,
      mentionText: updated.mentionText,
      explanation: updated.explanation ?? null,
      isEmbedded: updated.isEmbedded,
      embeddedAt: updated.embeddedAt ?? null,
      calculatedAt: updated.calculatedAt,
      createdAt: updated.createdAt,
      relatedPage: {
        id: updated.relatedPage.id,
        title: updated.relatedPage.title,
      },
    }
  }

  async delete(pageId: number, relationId: number, user: User): Promise<void> {
    await this.pagesHelperService.getPageForWrite(pageId, user)

    const existing = await this.dbService.pageRelation.findUnique({
      where: { id: relationId },
    })
    if (!existing || existing.originPageId !== pageId) {
      throw new NotFoundException('Relación no encontrada')
    }

    await this.dbService.pageRelation.delete({ where: { id: relationId } })
  }

  /**
   * Procesa el embedding de una página (para uso interno: workers, jobs).
   * Compila contenido de bloques, obtiene embedding de OpenAI y guarda en DB.
   * Retorna el embedding literal para búsquedas por similitud.
   */
  async processPageEmbedding(pageId: number): Promise<string | null> {
    const page = await this.dbService.page.findUnique({
      where: { id: pageId },
      include: { blocks: { orderBy: { orderIndex: 'asc' } } },
    })
    if (!page)
      throw new NotFoundException(`Página con ID ${pageId} no encontrada`)

    const compiledContent = this.compileFromBlocks(page.blocks)
    if (!compiledContent.trim()) return null

    const embedding = await this.openAiService.getEmbedding(compiledContent)
    const embeddingLiteral = `[${embedding.join(',')}]`

    await this.dbService.$executeRaw(
      Prisma.sql`UPDATE pages SET embedding = ${embeddingLiteral}::vector, compiled_content = ${compiledContent} WHERE id = ${pageId}`,
    )

    return embeddingLiteral
  }

  /**
   * Obtiene o crea el embedding de una página. Retorna el literal para búsquedas.
   */
  async ensurePageEmbedding(pageId: number): Promise<string> {
    const page = await this.dbService.page.findUnique({
      where: { id: pageId },
      include: { blocks: { orderBy: { orderIndex: 'asc' } } },
    })
    if (!page)
      throw new NotFoundException(`Página con ID ${pageId} no encontrada`)

    // Si ya existe embedding, leerlo desde DB
    const rows = await this.dbService.$queryRaw<{ embedding: string }[]>(
      Prisma.sql`SELECT embedding::text as embedding FROM pages WHERE id = ${pageId} AND embedding IS NOT NULL LIMIT 1`,
    )
    const embeddingLiteral = rows[0]?.embedding
    if (embeddingLiteral) return embeddingLiteral

    // Crear embedding
    const result = await this.processPageEmbedding(pageId)
    if (!result) {
      throw new NotFoundException(
        `La página ${pageId} no tiene contenido para generar embedding`,
      )
    }
    return result
  }

  private compileFromBlocks(blocks: Block[]): string {
    const mapped = blocks.map((b) => BlocksMapper.mapToDto(b))
    const parts: string[] = []

    for (const b of mapped) {
      if (b.type === BlockType.TEXT) {
        const markdown = String(
          (b.content as AiTextBlock).markdown || '',
        ).trim()
        if (markdown) parts.push(markdown)
      } else if (b.type === BlockType.CODE) {
        const lang = String((b.content as AiCodeBlock).language).trim()
        const code = String((b.content as AiCodeBlock).code).trim()
        if (code) parts.push(`Código (${lang || 'code'}):\n${code}`)
      }
    }

    return parts.join('\n\n---\n\n')
  }

  async findSimilarPages(params: {
    embeddingLiteral: string
    moduleId: number
    originPageId: number
    topK: number
    onlyPublished: boolean
    minSimilarity?: number
  }): Promise<SimilarRow[]> {
    const {
      embeddingLiteral,
      moduleId,
      originPageId,
      topK,
      onlyPublished,
      minSimilarity = 0.5,
    } = params

    // cosine distance: embedding <=> query (pgvector)
    // similarity: 1 - distance (rango -1 a 1)
    const rows = await this.dbService.$queryRaw<SimilarRow[]>(
      Prisma.sql`
        SELECT
          id,
          (1 - (embedding <=> ${embeddingLiteral}::vector))::float as similarity
        FROM pages
        WHERE module_id = ${moduleId}
          AND id <> ${originPageId}
          AND embedding IS NOT NULL
          AND (1 - (embedding <=> ${embeddingLiteral}::vector)) >= ${minSimilarity}
          ${onlyPublished ? Prisma.sql`AND is_published = true` : Prisma.sql``}
        ORDER BY (embedding <=> ${embeddingLiteral}::vector) ASC
        LIMIT ${topK}
      `,
    )

    return rows
  }
}
