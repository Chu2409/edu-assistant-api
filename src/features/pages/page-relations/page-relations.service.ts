import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { DBService } from 'src/core/database/database.service'
import { OpenaiService } from 'src/providers/ai/openai.service'
import {
  Enrollment,
  Prisma,
  Role,
  type User,
} from 'src/core/database/generated/client'
import { BlockType, RelationType } from 'src/core/database/generated/enums'
import { BlocksMapper } from '../blocks/mappers/blocks.mapper'
import type { AiTextBlock } from '../content-generation/interfaces/ai-generated-content.interface'
import { suggestPageRelationsPrompt } from './prompts/suggest-page-relations.prompt'
import { SuggestPageRelationsDto } from './dtos/req/suggest-page-relations.dto'
import { PageRelationsSuggestedDto } from './dtos/res/page-relations-suggested.dto'
import { CreatePageRelationDto } from './dtos/req/create-page-relation.dto'
import { UpdatePageRelationDto } from './dtos/req/update-page-relation.dto'
import { PageRelationDto } from './dtos/res/page-relation.dto'
import { RefreshPageEmbeddingDto } from './dtos/req/refresh-page-embedding.dto'
import { PageEmbeddingRefreshedDto } from './dtos/res/page-embedding-refreshed.dto'
import { PagesHelperService } from '../main/pages-helper.service'

type SimilarRow = { id: number; title: string; similarity: number }

@Injectable()
export class PageRelationsService {
  constructor(
    private readonly dbService: DBService,
    private readonly openAiService: OpenaiService,
    private readonly pagesHelperService: PagesHelperService,
  ) {}

  async list(pageId: number, user: User): Promise<PageRelationDto[]> {
    await this.pagesHelperService.getPageForRead(pageId, user)
    const relations = await this.dbService.pageRelation.findMany({
      where: { originPageId: pageId },
      orderBy: [{ similarityScore: 'desc' }, { createdAt: 'desc' }],
      include: { relatedPage: { select: { id: true, title: true } } },
    })

    return relations.map((r) => ({
      id: r.id,
      originPageId: r.originPageId,
      relatedPageId: r.relatedPageId,
      similarityScore: r.similarityScore,
      relationType: r.relationType as any,
      mentionText: r.mentionText,
      explanation: r.explanation ?? null,
      isEmbedded: r.isEmbedded,
      embeddedAt: r.embeddedAt ?? null,
      calculatedAt: r.calculatedAt,
      createdAt: r.createdAt,
      relatedPage: { id: r.relatedPage.id, title: r.relatedPage.title },
    }))
  }

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
        relationType: created.relationType as any,
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
      relationType: updated.relationType as any,
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

  async suggest(
    pageId: number,
    dto: SuggestPageRelationsDto,
    user: User,
  ): Promise<PageRelationsSuggestedDto> {
    const page = await this.pagesHelperService.getPageForWrite(pageId, user)

    // 1) Obtener/crear embedding de la página origen (y compiledContent)
    const { embeddingLiteral } = await this.ensurePageEmbedding(pageId)

    // 2) Buscar páginas cercanas por embedding en el mismo módulo (solo publicadas)
    const topK = dto.topK ?? 5
    const minScore = dto.minScore ?? 0.7

    const rows = await this.findSimilarPages({
      embeddingLiteral,
      moduleId: page.moduleId,
      originPageId: pageId,
      topK,
      onlyPublished: true,
    })

    const candidates = rows
      .map((r) => ({
        relatedPageId: r.id,
        relatedPageTitle: r.title,
        similarityScore: Number(r.similarity),
      }))
      .filter((c) => c.similarityScore >= minScore)

    if (candidates.length === 0) {
      return { suggestions: [] }
    }

    // 3) Preparar bloques de origen para anclas (solo TEXT)
    const blocks = await this.dbService.block.findMany({
      where: {
        pageId,
        type: BlockType.TEXT,
        ...(dto.scopeBlockIds?.length ? { id: { in: dto.scopeBlockIds } } : {}),
      },
      orderBy: { id: 'asc' },
    })
    const mapped = blocks.map((b) => BlocksMapper.mapToDto(b))
    const originBlocks = mapped.map((b) => ({
      blockId: b.id,
      markdown: String((b.content as any).markdown || '').slice(0, 1500),
    }))

    const language = 'es'

    // 4) Pedir a IA etiquetado + anclas (verbatim)
    const prompt = suggestPageRelationsPrompt({
      language,
      originTitle: page.title,
      originBlocks,
      candidates: candidates.map((c) => ({
        relatedPageId: c.relatedPageId,
        relatedPageTitle: c.relatedPageTitle,
      })),
      allowedRelationTypes: dto.relationTypes?.length
        ? dto.relationTypes
        : undefined,
    })

    const ai = await this.openAiService.getResponse<{
      suggestions: Array<{
        relatedPageId: number
        relationType: RelationType
        anchors: Array<{ blockId: number; mentionText: string }>
        explanation: string
      }>
    }>(prompt)

    // 5) Merge: agregar similarityScore + title desde candidates
    const byId = new Map<number, (typeof candidates)[number]>()
    for (const c of candidates) byId.set(c.relatedPageId, c)

    const suggestions = ai.content.suggestions
      .map((s) => {
        const c = byId.get(s.relatedPageId)
        if (!c) return null
        return {
          relatedPageId: s.relatedPageId,
          relatedPageTitle: c.relatedPageTitle,
          similarityScore: c.similarityScore,
          relationType: s.relationType,
          anchors: Array.isArray(s.anchors) ? s.anchors : [],
          explanation: s.explanation,
        }
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)

    return { suggestions }
  }

  async refreshEmbedding(
    pageId: number,
    dto: RefreshPageEmbeddingDto,
    user: User,
  ): Promise<PageEmbeddingRefreshedDto> {
    await this.pagesHelperService.getPageForWrite(pageId, user)

    const force = dto.force ?? true

    const page = await this.dbService.page.findUnique({
      where: { id: pageId },
      include: { blocks: true },
    })
    if (!page)
      throw new NotFoundException(`Página con ID ${pageId} no encontrada`)

    const blocks = dto.blockIds?.length
      ? page.blocks.filter((b) => dto.blockIds!.includes(b.id))
      : page.blocks

    const compiledContent = this.compileFromBlocks(blocks)

    // Si no forzamos y ya existe embedding, solo refrescamos compiledContent si cambió
    // @ts-ignore
    if (!force && page.embedding) {
      const needsContentUpdate = page.compiledContent !== compiledContent
      if (needsContentUpdate) {
        await this.dbService.page.update({
          where: { id: pageId },
          data: { compiledContent },
        })
      }
      return {
        pageId,
        compiledContentUpdated: needsContentUpdate,
        embeddingUpdated: false,
        compiledContentLength: compiledContent.length,
      }
    }

    const embedding = await this.openAiService.getEmbedding(compiledContent)
    const embeddingLiteral = `[${embedding.join(',')}]`

    await this.dbService.$executeRaw(
      Prisma.sql`UPDATE pages SET embedding = ${embeddingLiteral}::vector, compiled_content = ${compiledContent} WHERE id = ${pageId}`,
    )

    return {
      pageId,
      compiledContentUpdated: true,
      embeddingUpdated: true,
      compiledContentLength: compiledContent.length,
    }
  }

  private async ensurePageEmbedding(pageId: number): Promise<{
    embeddingLiteral: string
    compiledContent: string
  }> {
    const page = await this.dbService.page.findUnique({
      where: { id: pageId },
      include: { blocks: true },
    })
    if (!page)
      throw new NotFoundException(`Página con ID ${pageId} no encontrada`)

    const compiledContent =
      page.compiledContent ?? this.compileFromBlocks(page.blocks)

    // Si ya existe embedding, asumimos que está listo (lo consultamos como literal via SQL)
    // @ts-ignore
    if (page.embedding) {
      // leer embedding desde DB como texto (para evitar depender del tipo Unsupported)
      const rows = await this.dbService.$queryRaw<{ embedding: string }[]>(
        Prisma.sql`SELECT embedding::text as embedding FROM pages WHERE id = ${pageId} LIMIT 1`,
      )
      const embeddingLiteral = rows[0]?.embedding
      if (embeddingLiteral) {
        return { embeddingLiteral, compiledContent }
      }
    }

    const embedding = await this.openAiService.getEmbedding(compiledContent)
    const embeddingLiteral = `[${embedding.join(',')}]`

    await this.dbService.$executeRaw(
      Prisma.sql`UPDATE pages SET embedding = ${embeddingLiteral}::vector, compiled_content = ${compiledContent} WHERE id = ${pageId}`,
    )

    return { embeddingLiteral, compiledContent }
  }

  private compileFromBlocks(blocks: any[]): string {
    const mapped = blocks.map((b) => BlocksMapper.mapToDto(b))
    const parts: string[] = []

    for (const b of mapped) {
      if (b.type === BlockType.TEXT) {
        const markdown = String((b.content as any).markdown || '').trim()
        if (markdown) parts.push(markdown)
      } else if (b.type === BlockType.CODE) {
        const lang = String((b.content as any).language ?? '').trim()
        const code = String((b.content as any).code ?? '').trim()
        if (code) parts.push(`Código (${lang || 'code'}):\n${code}`)
      }
    }

    return parts.join('\n\n---\n\n')
  }

  private async findSimilarPages(params: {
    embeddingLiteral: string
    moduleId: number
    originPageId: number
    topK: number
    onlyPublished: boolean
  }): Promise<SimilarRow[]> {
    const { embeddingLiteral, moduleId, originPageId, topK, onlyPublished } =
      params

    // cosine distance: embedding <=> query (pgvector)
    // similarity: 1 - distance
    const rows = await this.dbService.$queryRaw<SimilarRow[]>(
      Prisma.sql`
        SELECT
          id,
          title,
          (1 - (embedding <=> ${embeddingLiteral}::vector))::float as similarity
        FROM pages
        WHERE module_id = ${moduleId}
          AND id <> ${originPageId}
          AND embedding IS NOT NULL
          ${onlyPublished ? Prisma.sql`AND is_published = true` : Prisma.sql``}
        ORDER BY (embedding <=> ${embeddingLiteral}::vector) ASC
        LIMIT ${topK}
      `,
    )

    return rows
  }
}
