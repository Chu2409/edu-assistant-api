import { User } from 'src/core/database/generated/client'
import { UserDto } from '../dtos/res/user.dto'

export class UsersMapper {
  static mapToDto(user: User): UserDto {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      lastName: user.lastName,
      isActive: user.isActive,
      microsoftId: user.microsoftId,
      displayName: user.displayName,
      profilePicture: user.profilePicture,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }
  }
}
