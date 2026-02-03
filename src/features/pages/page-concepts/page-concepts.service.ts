import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { DBService } from 'src/core/database/database.service'
import {
  Enrollment,
  Prisma,
  Role,
  type Page,
  type User,
} from 'src/core/database/generated/client'
import { ContentGenerationService } from '../content-generation/content-generation.service'
import { BlockType } from 'src/core/database/generated/enums'
import { BlocksMapper } from '../blocks/mappers/blocks.mapper'
import { AiTextBlock } from '../content-generation/interfaces/ai-generated-content.interface'
import { CreatePageConceptDto } from './dtos/req/create-page-concept.dto'
import { UpdatePageConceptDto } from './dtos/req/update-page-concept.dto'
import { SuggestPageConceptsDto } from './dtos/req/suggest-page-concepts.dto'
import { PageConceptDto } from './dtos/res/page-concept.dto'
import { PageConceptsSuggestedDto } from './dtos/res/page-concepts-suggested.dto'
import { PageConceptsMapper } from './mappers/page-concepts.mapper'
import { PagesHelperService } from '../main/pages-helper.service'

@Injectable()
export class PageConceptsService {
  constructor(
    private readonly dbService: DBService,
    private readonly contentGenerationService: ContentGenerationService,
    private readonly pagesHelperService: PagesHelperService,
  ) {}

  async list(pageId: number, user: User): Promise<PageConceptDto[]> {
    await this.pagesHelperService.getPageForRead(pageId, user)
    const concepts = await this.dbService.pageConcept.findMany({
      where: { pageId },
      orderBy: [{ term: 'asc' }],
    })
    return concepts.map((c) => PageConceptsMapper.toDto(c))
  }

  async create(
    pageId: number,
    dto: CreatePageConceptDto,
    user: User,
  ): Promise<PageConceptDto> {
    await this.pagesHelperService.getPageForWrite(pageId, user)

    try {
      const created = await this.dbService.pageConcept.create({
        data: {
          pageId,
          term: dto.term,
          definition: dto.definition,
        },
      })
      return PageConceptsMapper.toDto(created)
    } catch (e) {
      // Unique constraint: (pageId, term)
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ForbiddenException(
          'Ya existe un concepto con ese término en esta página',
        )
      }
      throw e
    }
  }

  async update(
    pageId: number,
    conceptId: number,
    dto: UpdatePageConceptDto,
    user: User,
  ): Promise<PageConceptDto> {
    await this.pagesHelperService.getPageForWrite(pageId, user)

    const existing = await this.dbService.pageConcept.findUnique({
      where: { id: conceptId },
    })
    if (!existing || existing.pageId !== pageId) {
      throw new NotFoundException('Concepto no encontrado')
    }

    const updated = await this.dbService.pageConcept.update({
      where: { id: conceptId },
      data: {
        ...(dto.term !== undefined && { term: dto.term }),
        ...(dto.definition !== undefined && { definition: dto.definition }),
      },
    })

    return PageConceptsMapper.toDto(updated)
  }

  async delete(pageId: number, conceptId: number, user: User): Promise<void> {
    await this.pagesHelperService.getPageForWrite(pageId, user)

    const existing = await this.dbService.pageConcept.findUnique({
      where: { id: conceptId },
    })
    if (!existing || existing.pageId !== pageId) {
      throw new NotFoundException('Concepto no encontrado')
    }

    await this.dbService.pageConcept.delete({ where: { id: conceptId } })
  }

  async suggest(
    pageId: number,
    dto: SuggestPageConceptsDto,
    user: User,
  ): Promise<PageConceptsSuggestedDto> {
    await this.pagesHelperService.getPageForWrite(pageId, user)

    const page = await this.dbService.page.findUnique({
      where: { id: pageId },
      include: {
        blocks: true,
        module: { include: { aiConfiguration: true } },
      },
    })

    if (!page) {
      throw new NotFoundException(`Página con ID ${pageId} no encontrada`)
    }

    const blocks = page.blocks.map((b) => BlocksMapper.mapToDto(b))
    const textBlocks = blocks.filter((b) => b.type === BlockType.TEXT)
    const selectedTextBlocks = dto.blockIds?.length
      ? textBlocks.filter((b) => dto.blockIds!.includes(b.id))
      : textBlocks

    const aiTextBlocks = selectedTextBlocks.map((b) => b.content as AiTextBlock)

    if (aiTextBlocks.length === 0) {
      return { anchors: [] }
    }

    const extracted = await this.contentGenerationService.extractPageConcepts({
      pageId,
    })

    const anchors = selectedTextBlocks.map((block) => {
      const markdown = String((block.content as any).markdown || '')
      const markdownLower = markdown.toLocaleLowerCase()

      const terms = extracted.terms
        .filter((t) => markdownLower.includes(t.term.toLocaleLowerCase()))
        .reduce(
          (acc, t) => {
            const key = t.term.toLocaleLowerCase()
            if (!acc.seen.has(key)) {
              acc.seen.add(key)
              acc.items.push({ term: t.term, definition: t.definition })
            }
            return acc
          },
          {
            seen: new Set<string>(),
            items: [] as { term: string; definition: string }[],
          },
        ).items

      return { blockId: block.id, terms }
    })

    // Solo devolvemos anclas con términos encontrados en el bloque
    return { anchors: anchors.filter((a) => a.terms.length > 0) }
  }
}
