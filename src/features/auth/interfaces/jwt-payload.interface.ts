export interface JwtPayload {
  sub: number
  email: string
  displayName: string
  iat?: number
  exp?: number
}
