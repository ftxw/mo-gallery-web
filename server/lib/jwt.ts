import 'server-only'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'secretKey'

export interface JwtPayload {
  sub: string
  username: string
  isAdmin?: boolean
  oauthProvider?: string
  avatarUrl?: string
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload
}
