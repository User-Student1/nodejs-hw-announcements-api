import type { Request, Response } from 'express'
import { randomUUID } from 'node:crypto'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import createHttpError from 'http-errors'
import prisma from '../../prisma/client.ts'
import type { RegisterInput, LoginInput, RefreshInput } from '../validators/auth.validator.ts'

// User fields that are safe to return (never the password)
const publicUserSelect = {
  id: true,
  username: true,
  email: true,
  name: true,
} as const

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET is not set in .env')
  return secret
}

// Create an access/refresh token pair for a user
function createTokens(userId: number) {
  const secret = getJwtSecret()

  const accessToken = jwt.sign(
    { sub: String(userId), type: 'access' },
    secret,
    { expiresIn: '15m' },
  )

  const refreshToken = jwt.sign(
    { sub: String(userId), type: 'refresh', jti: randomUUID() },
    secret,
    { expiresIn: '7d' },
  )

  return { accessToken, refreshToken }
}

// POST /auth/register
export async function register(req: Request, res: Response) {
  const { username, email, password, name } = req.body as RegisterInput

  // 1. Is the username or email already taken?
  const existing = await prisma.user.findFirst({
    where: { OR: [{ username }, { email }] },
  })
  if (existing) {
    throw createHttpError(409, 'Username or email already taken')
  }

  // 2. Hash the password (10 = bcrypt cost factor)
  const hashedPassword = await bcrypt.hash(password, 10)

  // 3. Create the user and return only safe fields
  const user = await prisma.user.create({
    data: { username, email, password: hashedPassword, name },
    select: publicUserSelect,
  })

  // 4. Issue tokens and store the refresh token
  const tokens = createTokens(user.id)
  await prisma.refreshToken.create({
    data: { token: tokens.refreshToken, userId: user.id },
  })

  res.status(201).json({ user, ...tokens })
}

// POST /auth/login
export async function login(req: Request, res: Response) {
  const { username, password } = req.body as LoginInput

  // 1. Find the user and check the password
  const user = await prisma.user.findUnique({ where: { username } })
  const passwordOk = user ? await bcrypt.compare(password, user.password) : false

  // 2. Same response for unknown user and wrong password
  if (!user || !passwordOk) {
    throw createHttpError(401, 'Invalid credentials')
  }

  // 3. Replace the old refresh token with a new one
  await prisma.refreshToken.deleteMany({ where: { userId: user.id } })
  const tokens = createTokens(user.id)
  await prisma.refreshToken.create({
    data: { token: tokens.refreshToken, userId: user.id },
  })

  res.json({
    user: { id: user.id, username: user.username, email: user.email, name: user.name },
    ...tokens,
  })
}
// GET /auth/me (protected)
export async function me(req: Request, res: Response) {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.sub },
    select: { ...publicUserSelect, createdAt: true },
  })
  if (!user) {
    throw createHttpError(404, 'User not found')
  }
  res.json(user)
}

// POST /auth/logout (protected)
export async function logout(req: Request, res: Response) {
  await prisma.refreshToken.deleteMany({ where: { userId: req.user!.sub } })
  res.status(204).end()
}

// POST /auth/refresh
export async function refresh(req: Request, res: Response) {
  const { refreshToken } = req.body as RefreshInput

  // 1. Verify signature and expiry
  let payload: string | jwt.JwtPayload
  try {
    payload = jwt.verify(refreshToken, getJwtSecret())
  } catch {
    throw createHttpError(401, 'Invalid refresh token')
  }
  if (typeof payload === 'string' || payload.type !== 'refresh') {
    throw createHttpError(401, 'Invalid refresh token')
  }

  // 2. Is the token stored in the database?
  const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } })
  if (!stored) {
    throw createHttpError(401, 'Invalid refresh token')
  }

  // 3. Rotation: delete the old token...
  const deleted = await prisma.refreshToken.deleteMany({ where: { id: stored.id } })
  if (deleted.count === 0) {
    throw createHttpError(401, 'Invalid refresh token')
  }

  // ...and issue a new pair, storing the new refresh token
  const tokens = createTokens(stored.userId)
  await prisma.refreshToken.create({
    data: { token: tokens.refreshToken, userId: stored.userId },
  })

  res.json(tokens)
}