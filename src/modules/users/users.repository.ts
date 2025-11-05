import { Injectable } from '@nestjs/common'
import { DBService } from 'src/core/database/database.service'
import { UserFiltersReqDto } from './dto/req/user-filters.dto'
import { CreateUserReqDto } from './dto/req/create-user.dto'
import { UpdateUserReqDto } from './dto/req/update-user.dto'
import { Prisma } from '@prisma/client'
import { UserResDto } from './dto/res/user.dto'

@Injectable()
export class UsersRepository {
  constructor(private readonly dbService: DBService) {}

  async findMany(filters: UserFiltersReqDto): Promise<[UserResDto[], number]> {
    const { limit, page, search } = filters

    const whereClause: Prisma.UserWhereInput = {}

    if (search) {
      whereClause.OR = [
        {
          firstName: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          lastName: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          email: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ]
    }

    const [entities, total] = await Promise.all([
      this.dbService.user.findMany({
        take: limit,
        skip: (page - 1) * limit,
        where: whereClause,
        orderBy: {
          id: 'desc',
        },
        omit: {
          password: true,
        },
      }),
      this.dbService.user.count({
        where: whereClause,
      }),
    ])

    return [entities, total]
  }

  async findById(id: string) {
    return this.dbService.user.findUnique({
      where: { id },
      omit: {
        password: true,
      },
    })
  }

  async verifyIfExists({
    email,
    excludeUserId,
  }: {
    email?: string
    excludeUserId?: string
  }) {
    if (!email) return null

    const conditions: Prisma.UserWhereInput = {
      OR: [],
      NOT: {},
    }

    if (email) {
      conditions.OR?.push({ email })
    }

    if (excludeUserId) {
      conditions.NOT = { id: excludeUserId }
    }

    return this.dbService.user.findFirst({
      where: conditions,
    })
  }

  async create(userData: CreateUserReqDto) {
    return this.dbService.$transaction(async (prisma) => {
      return prisma.user.create({
        data: {
          ...userData,
        },
        omit: {
          password: true,
        },
      })
    })
  }

  async update(id: string, data: UpdateUserReqDto) {
    return this.dbService.user.update({
      where: { id },
      data: {
        ...data,
        password: data.password ? data.password : undefined,
      },
      omit: {
        password: true,
      },
    })
  }

  async remove(id: string) {
    return this.dbService.user.delete({
      where: { id },
      omit: {
        password: true,
      },
    })
  }

  async changeStatus(id: string, status: boolean) {
    return this.dbService.user.update({
      where: { id },
      data: { isActive: status },
      omit: {
        password: true,
      },
    })
  }
}
