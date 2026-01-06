import { applyDecorators, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'

export const MicrosoftAuth = () => {
  return applyDecorators(UseGuards(AuthGuard('microsoft')))
}
