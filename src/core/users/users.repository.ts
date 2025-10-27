import { Injectable } from '@nestjs/common'
import { DBService } from 'src/global/database/database.service'
import { UserFiltersReqDto } from './dto/req/user-filters.dto'
import { UserPersonResDto } from './dto/res/user.dto'
import { CreateUserReqDto } from './dto/req/create-user.dto'
import { UpdateUserReqDto } from './dto/req/update-user.dto'
import { USER_STATUS } from './types/user-status.enum'
import { Prisma } from '@prisma/client'

@Injectable()
export class UsersRepository {
  constructor(private readonly dbService: DBService) {}

  async findMany(
    filters: UserFiltersReqDto,
  ): Promise<[UserPersonResDto[], number]> {
    const { limit, page, search } = filters

    const whereClause: Prisma.UserWhereInput = {}

    if (search) {
      whereClause.OR = [
        {
          username: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          person: {
            OR: [
              {
                name: {
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
            ],
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
        include: {
          person: true,
        },
      }),
      this.dbService.user.count({
        where: whereClause,
      }),
    ])

    return [entities, total]
  }

  async findById(id: number) {
    return this.dbService.user.findUnique({
      where: { id },
      include: {
        person: true,
      },
    })
  }

  async verifyIfExists({
    email,
    excludeUserId,
    username,
    dni,
  }: {
    username?: string
    email?: string
    dni?: string
    excludeUserId?: number
  }) {
    if (!username && !email && !dni) return null

    const conditions: Prisma.UserWhereInput = {
      OR: [],
      NOT: {},
    }

    if (username) {
      conditions.OR?.push({ username })
    }

    if (email) {
      conditions.OR?.push({ person: { email } })
    }

    if (dni) {
      conditions.OR?.push({ person: { dni } })
    }

    if (excludeUserId) {
      conditions.NOT = { id: excludeUserId }
    }

    return this.dbService.user.findFirst({
      where: conditions,
      include: {
        person: true,
      },
    })
  }

  async createWithPerson(userData: CreateUserReqDto) {
    return this.dbService.$transaction(async (prisma) => {
      return prisma.user.create({
        data: {
          ...userData,
          person: {
            create: userData.person,
          },
        },
        include: {
          person: true,
        },
      })
    })
  }

  async updateWithPerson(id: number, data: UpdateUserReqDto) {
    return this.dbService.user.update({
      where: { id },
      data: {
        ...data,
        password: data.password ? data.password : undefined,
        person: {
          update: {
            ...data.person,
          },
        },
      },
      include: {
        person: true,
      },
    })
  }

  async remove(id: number) {
    return this.dbService.user.delete({
      where: { id },
      include: {
        person: true,
      },
    })
  }

  async changeStatus(id: number, status: USER_STATUS) {
    return this.dbService.user.update({
      where: { id },
      data: { status },
      include: {
        person: true,
      },
    })
  }
}
