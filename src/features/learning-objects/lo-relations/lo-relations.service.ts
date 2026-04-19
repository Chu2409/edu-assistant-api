import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common'
import { BusinessException } from 'src/shared/exceptions/business.exception'
import { DBService } from 'src/core/database/database.service'
import { OpenaiService } from 'src/providers/ai/services/openai.service'
import { Prisma, type User } from 'src/core/database/generated/client'
import { CreateLoRelationDto } from './dtos/req/create-lo-relation.dto'
import { UpdateLoRelationDto } from './dtos/req/update-lo-relation.dto'
import { LoRelationDto } from './dtos/res/lo-relation.dto'
import { LoHelperService } from '../main/lo-helper.service'
import { compileBlocksToText } from '../blocks/helpers/compile-blocks'

type SimilarRow = { id: number; similarity: number }

@Injectable()
export class LoRelationsService {
  constructor(
    private readonly dbService: DBService,
    private readonly openAiService: OpenaiService,
    private readonly loHelperService: LoHelperService,
  ) {}

  async create(
    learningObjectId: number,
    dto: CreateLoRelationDto,
    user: User,
  ): Promise<LoRelationDto> {
    await this.loHelperService.getLoForWrite(learningObjectId, user)

    const related = await this.dbService.learningObject.findUnique({
      where: { id: dto.relatedLoId },
      select: { id: true, title: true, moduleId: true },
    })
    if (!related)
      throw new NotFoundException(
        'Objeto de aprendizaje relacionado no encontrado',
      )

    const origin = await this.dbService.learningObject.findUnique({
      where: { id: learningObjectId },
      select: { moduleId: true },
    })
    if (!origin)
      throw new NotFoundException(
        `Objeto de aprendizaje con ID ${learningObjectId} no encontrado`,
      )
    if (related.moduleId !== origin.moduleId) {
      throw new BusinessException(
        'El objeto de aprendizaje relacionado debe pertenecer al mismo módulo',
        HttpStatus.FORBIDDEN,
      )
    }

    try {
      const created = await this.dbService.learningObjectRelation.create({
        data: {
          originLoId: learningObjectId,
          relatedLoId: dto.relatedLoId,
          similarityScore: dto.similarityScore ?? 0,
          relationType: dto.relationType,
          mentionText: dto.mentionText,
          explanation: dto.explanation ?? null,
          isEmbedded: dto.isEmbedded ?? false,
        },
        include: { relatedLo: { select: { id: true, title: true } } },
      })

      return {
        id: created.id,
        originLoId: created.originLoId,
        relatedLoId: created.relatedLoId,
        similarityScore: created.similarityScore,
        relationType: created.relationType,
        mentionText: created.mentionText,
        explanation: created.explanation ?? null,
        isEmbedded: created.isEmbedded,
        embeddedAt: created.embeddedAt ?? null,
        calculatedAt: created.calculatedAt,
        createdAt: created.createdAt,
        relatedLo: {
          id: created.relatedLo.id,
          title: created.relatedLo.title,
        },
      }
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new BusinessException(
          'Ya existe una relación con ese objeto de aprendizaje relacionado',
          HttpStatus.CONFLICT,
        )
      }
      throw e
    }
  }

  async update(
    learningObjectId: number,
    relationId: number,
    dto: UpdateLoRelationDto,
    user: User,
  ): Promise<LoRelationDto> {
    await this.loHelperService.getLoForWrite(learningObjectId, user)

    const existing = await this.dbService.learningObjectRelation.findUnique({
      where: { id: relationId },
      include: { relatedLo: { select: { id: true, title: true } } },
    })
    if (!existing || existing.originLoId !== learningObjectId) {
      throw new NotFoundException('Relación no encontrada')
    }

    const updated = await this.dbService.learningObjectRelation.update({
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
      include: { relatedLo: { select: { id: true, title: true } } },
    })

    return {
      id: updated.id,
      originLoId: updated.originLoId,
      relatedLoId: updated.relatedLoId,
      similarityScore: updated.similarityScore,
      relationType: updated.relationType,
      mentionText: updated.mentionText,
      explanation: updated.explanation ?? null,
      isEmbedded: updated.isEmbedded,
      embeddedAt: updated.embeddedAt ?? null,
      calculatedAt: updated.calculatedAt,
      createdAt: updated.createdAt,
      relatedLo: {
        id: updated.relatedLo.id,
        title: updated.relatedLo.title,
      },
    }
  }

  async delete(
    learningObjectId: number,
    relationId: number,
    user: User,
  ): Promise<void> {
    await this.loHelperService.getLoForWrite(learningObjectId, user)

    const existing = await this.dbService.learningObjectRelation.findUnique({
      where: { id: relationId },
    })
    if (!existing || existing.originLoId !== learningObjectId) {
      throw new NotFoundException('Relación no encontrada')
    }

    await this.dbService.learningObjectRelation.delete({
      where: { id: relationId },
    })
  }

  /**
   * Procesa el embedding de un objeto de aprendizaje (para uso interno: workers, jobs).
   * Compila contenido de bloques, obtiene embedding de OpenAI y guarda en DB.
   * Retorna el embedding literal para búsquedas por similitud.
   */
  async processPageEmbedding(learningObjectId: number): Promise<string | null> {
    const lo = await this.dbService.learningObject.findUnique({
      where: { id: learningObjectId },
      include: { blocks: { orderBy: { orderIndex: 'asc' } } },
    })
    if (!lo)
      throw new NotFoundException(
        `Objeto de aprendizaje con ID ${learningObjectId} no encontrado`,
      )

    const compiledContent = compileBlocksToText(lo.blocks)
    if (!compiledContent.trim()) return null

    const embedding = await this.openAiService.getEmbedding(compiledContent)
    const embeddingLiteral = `[${embedding.join(',')}]`

    await this.dbService.$executeRaw(
      Prisma.sql`UPDATE learning_objects SET embedding = ${embeddingLiteral}::vector, compiled_content = ${compiledContent} WHERE id = ${learningObjectId}`,
    )

    return embeddingLiteral
  }

  /**
   * Obtiene o crea el embedding de un objeto de aprendizaje. Retorna el literal para búsquedas.
   */
  async ensurePageEmbedding(learningObjectId: number): Promise<string> {
    const lo = await this.dbService.learningObject.findUnique({
      where: { id: learningObjectId },
      include: { blocks: { orderBy: { orderIndex: 'asc' } } },
    })
    if (!lo)
      throw new NotFoundException(
        `Objeto de aprendizaje con ID ${learningObjectId} no encontrado`,
      )

    // Si ya existe embedding, leerlo desde DB
    const rows = await this.dbService.$queryRaw<{ embedding: string }[]>(
      Prisma.sql`SELECT embedding::text as embedding FROM learning_objects WHERE id = ${learningObjectId} AND embedding IS NOT NULL LIMIT 1`,
    )
    const embeddingLiteral = rows[0]?.embedding
    if (embeddingLiteral) return embeddingLiteral

    // Crear embedding
    const result = await this.processPageEmbedding(learningObjectId)
    if (!result) {
      throw new NotFoundException(
        `El objeto de aprendizaje ${learningObjectId} no tiene contenido para generar embedding`,
      )
    }
    return result
  }

  async findSimilarPages(params: {
    embeddingLiteral: string
    moduleId: number
    originLoId: number
    onlyPublished: boolean
    minSimilarity?: number
  }): Promise<SimilarRow[]> {
    const {
      embeddingLiteral,
      moduleId,
      originLoId,
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
        FROM learning_objects
        WHERE module_id = ${moduleId}
          AND id <> ${originLoId}
          AND embedding IS NOT NULL
          AND (1 - (embedding <=> ${embeddingLiteral}::vector)) >= ${minSimilarity}
          ${onlyPublished ? Prisma.sql`AND is_published = true` : Prisma.sql``}
        ORDER BY (embedding <=> ${embeddingLiteral}::vector) ASC
      `,
    )

    return rows
  }
}
