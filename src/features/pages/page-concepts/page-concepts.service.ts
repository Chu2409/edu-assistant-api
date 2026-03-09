import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { DBService } from 'src/core/database/database.service'
import { Prisma, type User } from 'src/core/database/generated/client'
import { ContentGenerationService } from '../content-generation/content-generation.service'
import { CreatePageConceptDto } from './dtos/req/create-page-concept.dto'
import { UpdatePageConceptDto } from './dtos/req/update-page-concept.dto'
import { PageConceptDto } from './dtos/res/page-concept.dto'
import { PageConceptsMapper } from './mappers/page-concepts.mapper'
import { PagesHelperService } from '../main/pages-helper.service'

@Injectable()
export class PageConceptsService {
  constructor(
    private readonly dbService: DBService,
    private readonly contentGenerationService: ContentGenerationService,
    private readonly pagesHelperService: PagesHelperService,
  ) {}

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
}
