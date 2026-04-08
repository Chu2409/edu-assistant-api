import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common'
import { DBService } from 'src/core/database/database.service'
import { CreateLoTypeDto } from './dtos/req/create-lo-type.dto'
import { UpdateLoTypeDto } from './dtos/req/update-lo-type.dto'
import { LoTypeDto } from './dtos/res/lo-type.dto'
import { LoTypeMapper } from './mappers/lo-type.mapper'

@Injectable()
export class LoTypesService {
  constructor(private readonly dbService: DBService) {}

  async create(dto: CreateLoTypeDto): Promise<LoTypeDto> {
    const existing = await this.dbService.learningObjectType.findUnique({
      where: { name: dto.name },
    })

    if (existing) {
      throw new ConflictException(
        `Ya existe un tipo de objeto de aprendizaje con el nombre: ${dto.name}`,
      )
    }

    const entity = await this.dbService.learningObjectType.create({
      data: {
        name: dto.name,
        description: dto.description,
      },
    })

    return LoTypeMapper.mapToDto(entity)
  }

  async findAll(): Promise<LoTypeDto[]> {
    const entities = await this.dbService.learningObjectType.findMany({
      orderBy: { name: 'asc' },
    })
    return entities.map((entity) => LoTypeMapper.mapToDto(entity))
  }

  async findOne(id: number): Promise<LoTypeDto> {
    const entity = await this.dbService.learningObjectType.findUnique({
      where: { id },
    })

    if (!entity) {
      throw new NotFoundException(
        `Tipo de objeto de aprendizaje con ID ${id} no encontrado`,
      )
    }

    return LoTypeMapper.mapToDto(entity)
  }

  async update(id: number, dto: UpdateLoTypeDto): Promise<LoTypeDto> {
    const existing = await this.dbService.learningObjectType.findUnique({
      where: { id },
    })

    if (!existing) {
      throw new NotFoundException(
        `Tipo de objeto de aprendizaje con ID ${id} no encontrado`,
      )
    }

    if (dto.name && dto.name !== existing.name) {
      const duplicate = await this.dbService.learningObjectType.findUnique({
        where: { name: dto.name },
      })
      if (duplicate) {
        throw new ConflictException(
          `Ya existe un tipo de objeto de aprendizaje con el nombre: ${dto.name}`,
        )
      }
    }

    const updated = await this.dbService.learningObjectType.update({
      where: { id },
      data: dto,
    })

    return LoTypeMapper.mapToDto(updated)
  }

  async remove(id: number): Promise<void> {
    const existing = await this.dbService.learningObjectType.findUnique({
      where: { id },
      include: {
        _count: {
          select: { learningObjects: true },
        },
      },
    })

    if (!existing) {
      throw new NotFoundException(
        `Tipo de objeto de aprendizaje con ID ${id} no encontrado`,
      )
    }

    if (existing._count.learningObjects > 0) {
      throw new ConflictException(
        'No se puede eliminar el tipo porque está siendo usado por objetos de aprendizaje.',
      )
    }

    await this.dbService.learningObjectType.delete({
      where: { id },
    })
  }
}
