import { USER_TYPE } from 'src/modules/users/types/user-type.enum'

export class JwtPayload {
  id: number
  role: USER_TYPE
}
