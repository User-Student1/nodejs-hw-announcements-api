import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import createHttpError from 'http-errors'

// Add the user field to Express Request
declare global {
  namespace Express {
    interface Request {
      user?: { sub: number }
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  // 1. Is there an "Authorization: Bearer <token>" header?
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    throw createHttpError(401, 'Authorization header missing or invalid')
  }

  // 2. Strip the "Bearer " prefix
  const token = header.slice('Bearer '.length)

  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET is not set in .env')

  // 3. Verify signature and expiry
  let payload: string | jwt.JwtPayload
  try {
    payload = jwt.verify(token, secret)
  } catch {
    throw createHttpError(401, 'Invalid or expired token')
  }

  // 4. Make sure it is an access token
  if (typeof payload === 'string' || payload.type !== 'access' || !payload.sub) {
    throw createHttpError(401, 'Invalid or expired token')
  }

  // 5. Remember who is calling and continue
  req.user = { sub: Number(payload.sub) }
  next()
}