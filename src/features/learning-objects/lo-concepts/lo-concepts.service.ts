import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common'
import { BusinessException } from 'src/shared/exceptions/business.exception'
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
    private readonly loHelperService: LoHelperService,
  ) {}

  async create(
    learningObjectId: number,
    dto: CreateLoConceptDto,
    user: User,
  ): Promise<LoConceptDto> {
    await this.loHelperService.getLoForWrite(learningObjectId, user)

    try {
      const created = await this.dbService.learningObjectConcept.create({
        data: {
          learningObjectId,
          term: dto.term,
          definition: dto.definition,
        },
      })
      return LoConceptsMapper.toDto(created)
    } catch (e) {
      // Unique constraint: (learningObjectId, term)
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new BusinessException(
          'Ya existe un concepto con ese término en este objeto de aprendizaje',
          HttpStatus.CONFLICT,
        )
      }
      throw e
    }
  }

  async update(
    learningObjectId: number,
    conceptId: number,
    dto: UpdateLoConceptDto,
    user: User,
  ): Promise<LoConceptDto> {
    await this.loHelperService.getLoForWrite(learningObjectId, user)

    const existing = await this.dbService.learningObjectConcept.findUnique({
      where: { id: conceptId },
    })
    if (!existing || existing.learningObjectId !== learningObjectId) {
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

  async delete(
    learningObjectId: number,
    conceptId: number,
    user: User,
  ): Promise<void> {
    await this.loHelperService.getLoForWrite(learningObjectId, user)

    const existing = await this.dbService.learningObjectConcept.findUnique({
      where: { id: conceptId },
    })
    if (!existing || existing.learningObjectId !== learningObjectId) {
      throw new NotFoundException('Concepto no encontrado')
    }

    await this.dbService.learningObjectConcept.delete({
      where: { id: conceptId },
    })
  }
}
