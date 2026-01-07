import { Enrollment, User } from 'src/core/database/generated/client'
import { EnrollmentDto } from '../dtos/res/enrollment.dto'
import { EnrollmentStudentsDto } from '../dtos/res/enrollment-student.dto'
import { UsersMapper } from 'src/features/users/mappers/users.mapper'

export class EnrollmentsMapper {
  static mapToDto(enrollment: Enrollment): EnrollmentDto {
    return {
      id: enrollment.id,
      userId: enrollment.userId,
      moduleId: enrollment.moduleId,
      enrolledAt: enrollment.enrolledAt,
      completedAt: enrollment.completedAt,
      isActive: enrollment.isActive,
    }
  }

  static mapToEnrollmentStudentsDto(
    enrollment: Enrollment & { user: User },
  ): EnrollmentStudentsDto {
    return {
      id: enrollment.id,
      user: UsersMapper.mapToDto(enrollment.user),
      enrolledAt: enrollment.enrolledAt,
      completedAt: enrollment.completedAt,
      isActive: enrollment.isActive,
    }
  }
}
