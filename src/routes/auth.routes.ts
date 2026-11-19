import { Router } from 'express'
import type { ZodType } from 'zod'
import { register, login, refresh, logout, me } from '../controllers/auth.controller.ts'
import { validateBody } from '../middleware/validate.ts'
import { authenticate } from '../middleware/authenticate.ts'
import { registry } from '../openapi.ts'
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  authResponseSchema,
  tokensResponseSchema,
  meResponseSchema,
  errorResponseSchema,
  validationErrorSchema,
} from '../validators/auth.validator.ts'

const router = Router()

// Public routes
router.post('/register', validateBody(registerSchema), register)
router.post('/login', validateBody(loginSchema), login)
router.post('/refresh', validateBody(refreshSchema), refresh)

// Protected routes
router.post('/logout', authenticate, logout)
router.get('/me', authenticate, me)

export default router

// ===== OpenAPI documentation =====

// Helper: JSON body or response described by a Zod schema
const json = (schema: ZodType) => ({ content: { 'application/json': { schema } } })

registry.registerPath({
  method: 'post',
  path: '/auth/register',
  tags: ['Auth'],
  summary: 'Register a new user',
  request: { body: json(registerSchema) },
  responses: {
    201: { description: 'User created, token pair returned', ...json(authResponseSchema) },
    400: { description: 'Validation failed', ...json(validationErrorSchema) },
    409: { description: 'Username or email already taken', ...json(errorResponseSchema) },
  },
})

registry.registerPath({
  method: 'post',
  path: '/auth/login',
  tags: ['Auth'],
  summary: 'Log in',
  request: { body: json(loginSchema) },
  responses: {
    200: { description: 'Logged in, new token pair returned', ...json(authResponseSchema) },
    400: { description: 'Validation failed', ...json(validationErrorSchema) },
    401: { description: 'Invalid credentials', ...json(errorResponseSchema) },
  },
})

registry.registerPath({
  method: 'post',
  path: '/auth/refresh',
  tags: ['Auth'],
  summary: 'Refresh token pair (token rotation)',
  request: { body: json(refreshSchema) },
  responses: {
    200: { description: 'New token pair', ...json(tokensResponseSchema) },
    400: { description: 'Validation failed', ...json(validationErrorSchema) },
    401: { description: 'Invalid or revoked refresh token', ...json(errorResponseSchema) },
  },
})

registry.registerPath({
  method: 'post',
  path: '/auth/logout',
  tags: ['Auth'],
  summary: 'Log out: refresh token is removed from the database',
  security: [{ bearerAuth: [] }],
  responses: {
    204: { description: 'Logged out' },
    401: { description: 'Missing or invalid access token', ...json(errorResponseSchema) },
  },
})

registry.registerPath({
  method: 'get',
  path: '/auth/me',
  tags: ['Auth'],
  summary: 'Current user profile',
  security: [{ bearerAuth: [] }],
  responses: {
    200: { description: 'User data without password', ...json(meResponseSchema) },
    401: { description: 'Missing or invalid access token', ...json(errorResponseSchema) },
  },
})