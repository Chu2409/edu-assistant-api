import { USER_ROLE } from 'src/modules/users/types/user-role.enum'

export class JwtPayload {
  id: string
  role: USER_ROLE
}
