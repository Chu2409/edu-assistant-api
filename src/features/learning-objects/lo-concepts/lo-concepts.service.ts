import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { DBService } from 'src/core/database/database.service'
import { Prisma, type User } from 'src/core/database/generated/client'
import { CreateLoConceptDto } from './dtos/req/create-lo-concept.dto'
import { UpdateLoConceptDto } from './dtos/req/update-lo-concept.dto'
import { LoConceptDto } from './dtos/res/lo-concept.dto'
import { LoConceptsMapper } from './mappers/lo-concepts.mapper'
import { LoHelperService } from '../main/lo-helper.service'

@Injectable()
export class LoConceptsService {
  constructor(
    private readonly dbService: DBService,
    private readonly pagesHelperService: LoHelperService,
  ) {}

  async create(
    pageId: number,
    dto: CreateLoConceptDto,
    user: User,
  ): Promise<LoConceptDto> {
    await this.pagesHelperService.getPageForWrite(pageId, user)

    try {
      const created = await this.dbService.learningObjectConcept.create({
        data: {
          learningObjectId: pageId,
          term: dto.term,
          definition: dto.definition,
        },
      })
      return LoConceptsMapper.toDto(created)
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
    dto: UpdateLoConceptDto,
    user: User,
  ): Promise<LoConceptDto> {
    await this.pagesHelperService.getPageForWrite(pageId, user)

    const existing = await this.dbService.learningObjectConcept.findUnique({
      where: { id: conceptId },
    })
    if (!existing || existing.learningObjectId !== pageId) {
      throw new NotFoundException('Concepto no encontrado')
    }

    const updated = await this.dbService.learningObjectConcept.update({
      where: { id: conceptId },
      data: {
        ...(dto.term !== undefined && { term: dto.term }),
        ...(dto.definition !== undefined && { definition: dto.definition }),
      },
    })

    return LoConceptsMapper.toDto(updated)
  }

  async delete(pageId: number, conceptId: number, user: User): Promise<void> {
    await this.pagesHelperService.getPageForWrite(pageId, user)

    const existing = await this.dbService.learningObjectConcept.findUnique({
      where: { id: conceptId },
    })
    if (!existing || existing.learningObjectId !== pageId) {
      throw new NotFoundException('Concepto no encontrado')
    }

    await this.dbService.learningObjectConcept.delete({
      where: { id: conceptId },
    })
  }
}
