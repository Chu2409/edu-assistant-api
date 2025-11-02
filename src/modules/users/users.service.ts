import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common'
import { UpdateUserReqDto } from './dto/req/update-user.dto'
import { BusinessException } from 'src/shared/exceptions/business.exception'
import { hashPassword } from 'src/shared/utils/encrypter'
import { CreateUserReqDto } from './dto/req/create-user.dto'
import { UserFiltersReqDto } from './dto/req/user-filters.dto'
import { UsersRepository } from './users.repository'
import { ChangeUserStatusDto } from './dto/req/change-user-status.dto'
import { UserPersonResDto } from './dto/res/user.dto'

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
      username: dto.username,
      email: dto.person?.email,
      dni: dto.person?.dni,
    })

    dto.password = hashPassword(dto.password)

    const entity = await this.usersRepository.createWithPerson(dto)

    return !!entity
  }

  async update(id: number, dto: UpdateUserReqDto) {
    await this.findOne(id) // Verify user exists

    if (dto.username || dto.person?.email) {
      await this.validateUserUniqueness({
        username: dto.username,
        email: dto.person?.email,
        excludeUserId: id,
        dni: dto.person?.dni,
      })
    }

    if (dto.password) {
      dto.password = hashPassword(dto.password)
    }

    const entity = await this.usersRepository.updateWithPerson(id, dto)

    return !!entity
  }

  async findOne(id: number) {
    const userFound = await this.usersRepository.findById(id)

    if (!userFound) {
      throw new NotFoundException(`User with id ${id} not found`)
    }

    return this.mapToResponseDto(userFound)
  }

  async findOneWithPasswordByUsername(username: string) {
    const userFound = await this.usersRepository.verifyIfExists({ username })

    return userFound
  }

  async remove(id: number) {
    await this.findOne(id) // Verify user exists

    const deletedUser = await this.usersRepository.remove(id)

    return !!deletedUser
  }

  async changeStatus(id: number, dto: ChangeUserStatusDto) {
    await this.findOne(id)

    const user = await this.usersRepository.changeStatus(id, dto.status)

    return !!user
  }

  private async validateUserUniqueness({
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
    if (!username && !email) return

    const existingUser = await this.usersRepository.verifyIfExists({
      username,
      email,
      excludeUserId,
      dni,
    })

    if (existingUser) {
      if (existingUser.username === username) {
        throw new BusinessException(
          'El nombre de usuario ya está en uso',
          HttpStatus.CONFLICT,
        )
      } else if (existingUser.person?.email === email) {
        throw new BusinessException(
          'El correo electrónico ya está en uso',
          HttpStatus.CONFLICT,
        )
      } else if (existingUser.person?.dni === dni) {
        throw new BusinessException(
          'El DNI ya está en uso',
          HttpStatus.CONFLICT,
        )
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapToResponseDto(user: any): UserPersonResDto {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, personId, ...userData } = user
    return userData as UserPersonResDto
  }
}
