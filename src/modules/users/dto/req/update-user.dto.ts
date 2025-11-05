import { PartialType } from '@nestjs/mapped-types'
import { CreateUserReqDto } from './create-user.dto'

export class UpdateUserReqDto extends PartialType(CreateUserReqDto) {}
