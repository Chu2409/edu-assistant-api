import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common'
import { UpdateUserReqDto } from './dto/req/update-user.dto'
import { BusinessException } from 'src/shared/exceptions/business.exception'
import { hashPassword } from 'src/shared/utils/encrypter'
import { CreateUserReqDto } from './dto/req/create-user.dto'
import { UserFiltersReqDto } from './dto/req/user-filters.dto'
import { UsersRepository } from './users.repository'
import { UserResDto } from './dto/res/user.dto'

@Injectable()
export class UsersService {
  constructor(private usersRepository: UsersRepository) {}

  async findAll(filters: UserFiltersReqDto) {
    const [entities, total] = await this.usersRepository.findMany(filters)

    return {
      records: entities.map((user) => this.mapToResponseDto(user)),
      total,
      limit: filters.limit,
      page: filters.page,
      pages: Math.ceil(total / filters.limit),
    }
  }

  async create(dto: CreateUserReqDto) {
    await this.validateUserUniqueness({
      email: dto.email,
    })

    dto.password = hashPassword(dto.password)

    const entity = await this.usersRepository.create(dto)

    return !!entity
  }

  async update(id: string, dto: UpdateUserReqDto) {
    await this.findOne(id) // Verify user exists

    if (dto.email) {
      await this.validateUserUniqueness({
        email: dto.email,
        excludeUserId: id,
      })
    }

    if (dto.password) {
      dto.password = hashPassword(dto.password)
    }

    const entity = await this.usersRepository.update(id, dto)

    return !!entity
  }

  async findOne(id: string) {
    const userFound = await this.usersRepository.findById(id)

    if (!userFound) {
      throw new NotFoundException(`User with id ${id} not found`)
    }

    return this.mapToResponseDto(userFound)
  }

  async findOneWithPasswordByEmail(email: string) {
    const userFound = await this.usersRepository.verifyIfExists({ email })

    return userFound
  }

  async remove(id: string) {
    await this.findOne(id) // Verify user exists

    const deletedUser = await this.usersRepository.remove(id)

    return !!deletedUser
  }

  async changeStatus(id: string) {
    const userFound = await this.findOne(id)

    const user = await this.usersRepository.changeStatus(
      id,
      !userFound.isActive,
    )

    return !!user
  }

  private async validateUserUniqueness({
    email,
    excludeUserId,
  }: {
    email?: string
    excludeUserId?: string
  }) {
    if (!email) return

    const existingUser = await this.usersRepository.verifyIfExists({
      email,
      excludeUserId,
    })

    if (existingUser) {
      if (existingUser.email === email) {
        throw new BusinessException(
          'El nombre de usuario ya está en uso',
          HttpStatus.CONFLICT,
        )
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapToResponseDto(user: any): UserResDto {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, personId, ...userData } = user
    return userData as UserResDto
  }
}
