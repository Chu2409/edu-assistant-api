import { Injectable } from '@nestjs/common'
import { DBService } from 'src/core/database/database.service'
import { type Prisma } from 'src/core/database/generated/client'
import { UsersFiltersDto } from './dtos/req/users-filters.dto'
import { UserDto } from './dtos/res/user.dto'
import { UsersMapper } from './mappers/users.mapper'

@Injectable()
export class UsersService {
  constructor(private readonly dbService: DBService) {}

  async findStudents(params: UsersFiltersDto): Promise<UserDto[]> {
    const take = Math.min(params.limit || 20, 20)

    const where: Prisma.UserWhereInput = {
      // role: Role.STUDENT,
      isActive: true,
    }

    if (params.search) {
      where.AND = {
        OR: [
          { name: { contains: params.search, mode: 'insensitive' } },
          { lastName: { contains: params.search, mode: 'insensitive' } },
          { email: { contains: params.search, mode: 'insensitive' } },
        ],
      }
    }

    const entities = await this.dbService.user.findMany({
      where,
      skip: (params.page - 1) * take,
      take,
      orderBy: {
        createdAt: 'desc',
      },
    })

    return entities.map((entity) => UsersMapper.mapToDto(entity))
  }
}
