import { z } from 'zod'

// POST /auth/register
export const registerSchema = z.object({
  username: z.string().min(3).max(30),
  email: z.email(),
  password: z.string().min(6),
  name: z.string().min(2),
})

// POST /auth/login
export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
})

// POST /auth/refresh
export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type RefreshInput = z.infer<typeof refreshSchema>
// ===== Response schemas (used only for OpenAPI documentation) =====

export const userResponseSchema = z.object({
  id: z.number().int(),
  username: z.string(),
  email: z.string(),
  name: z.string(),
})

export const authResponseSchema = z.object({
  user: userResponseSchema,
  accessToken: z.string(),
  refreshToken: z.string(),
})

export const tokensResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
})

export const meResponseSchema = userResponseSchema.extend({
  createdAt: z.string(),
})

export const errorResponseSchema = z.object({
  error: z.string(),
})

export const validationErrorSchema = z.object({
  error: z.string(),
  details: z.record(z.string(), z.array(z.string())),
})