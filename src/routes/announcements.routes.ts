import { Router } from 'express'
import type { ZodType } from 'zod'
import {
  listAnnouncements,
  getAnnouncement,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from '../controllers/announcements.controller.ts'
import { authenticate } from '../middleware/authenticate.ts'
import { validateBody, validateParams, validateQuery } from '../middleware/validate.ts'
import { registry } from '../openapi.ts'
import {
  createAnnouncementSchema,
  updateAnnouncementSchema,
  idParamSchema,
  listQuerySchema,
  announcementResponseSchema,
  announcementListResponseSchema,
} from '../validators/announcements.validator.ts'
import { errorResponseSchema, validationErrorSchema } from '../validators/auth.validator.ts'

const router = Router()

// Public routes
router.get('/', validateQuery(listQuerySchema), listAnnouncements)
router.get('/:id', validateParams(idParamSchema), getAnnouncement)

// Protected routes
router.post('/', authenticate, validateBody(createAnnouncementSchema), createAnnouncement)
router.patch(
  '/:id',
  authenticate,
  validateParams(idParamSchema),
  validateBody(updateAnnouncementSchema),
  updateAnnouncement,
)
router.delete('/:id', authenticate, validateParams(idParamSchema), deleteAnnouncement)

export default router

// ===== OpenAPI documentation =====

// Helper: JSON body or response described by a Zod schema
const json = (schema: ZodType) => ({ content: { 'application/json': { schema } } })

// Shared error responses
const badRequest = { description: 'Validation failed', ...json(validationErrorSchema) }
const unauthorized = { description: 'Missing or invalid access token', ...json(errorResponseSchema) }
const forbidden = { description: 'Access denied: announcement belongs to another user', ...json(errorResponseSchema) }
const notFound = { description: 'Announcement not found', ...json(errorResponseSchema) }

registry.registerPath({
  method: 'get',
  path: '/announcements',
  tags: ['Announcements'],
  summary: 'List announcements: search, sort, pagination (10 per page)',
  request: { query: listQuerySchema },
  responses: {
    200: { description: 'Page of announcements', ...json(announcementListResponseSchema) },
    400: badRequest,
  },
})

registry.registerPath({
  method: 'get',
  path: '/announcements/{id}',
  tags: ['Announcements'],
  summary: 'Get one announcement with author data',
  request: { params: idParamSchema },
  responses: {
    200: { description: 'Announcement', ...json(announcementResponseSchema) },
    400: badRequest,
    404: notFound,
  },
})

registry.registerPath({
  method: 'post',
  path: '/announcements',
  tags: ['Announcements'],
  summary: 'Create an announcement (author is taken from the token)',
  security: [{ bearerAuth: [] }],
  request: { body: json(createAnnouncementSchema) },
  responses: {
    201: { description: 'Announcement created', ...json(announcementResponseSchema) },
    400: badRequest,
    401: unauthorized,
  },
})

registry.registerPath({
  method: 'patch',
  path: '/announcements/{id}',
  tags: ['Announcements'],
  summary: 'Partially update own announcement (at least one field)',
  security: [{ bearerAuth: [] }],
  request: { params: idParamSchema, body: json(updateAnnouncementSchema) },
  responses: {
    200: { description: 'Announcement updated', ...json(announcementResponseSchema) },
    400: badRequest,
    401: unauthorized,
    403: forbidden,
    404: notFound,
  },
})

registry.registerPath({
  method: 'delete',
  path: '/announcements/{id}',
  tags: ['Announcements'],
  summary: 'Delete own announcement',
  security: [{ bearerAuth: [] }],
  request: { params: idParamSchema },
  responses: {
    204: { description: 'Announcement deleted' },
    400: badRequest,
    401: unauthorized,
    403: forbidden,
    404: notFound,
  },
})