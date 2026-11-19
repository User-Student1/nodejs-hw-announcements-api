import { z } from 'zod'
import { userResponseSchema } from './auth.validator.ts'

export const categorySchema = z.enum(['sale', 'service', 'job', 'other'])

// POST /announcements: all fields are required
export const createAnnouncementSchema = z.object({
  title: z.string().min(5).max(50),
  description: z.string().min(10),
  price: z.number().positive(),
  category: categorySchema,
})

// PATCH /announcements/:id: all fields optional, but at least one is required
export const updateAnnouncementSchema = createAnnouncementSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  })

// :id route parameter
export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
})

// ?page=&search=&sort=
export const listQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  search: z.string().trim().optional(),
  sort: z.enum(['newest', 'oldest']).default('newest'),
})

export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>
export type UpdateAnnouncementInput = z.infer<typeof updateAnnouncementSchema>
export type IdParam = z.infer<typeof idParamSchema>
export type ListQuery = z.infer<typeof listQuerySchema>
// ===== Response schemas (used only for OpenAPI documentation) =====

export const announcementResponseSchema = z.object({
  id: z.number().int(),
  title: z.string(),
  description: z.string(),
  price: z.number(),
  category: categorySchema,
  createdAt: z.string(),
  updatedAt: z.string(),
  user: userResponseSchema,
})

export const announcementListResponseSchema = z.object({
  data: z.array(announcementResponseSchema),
  pagination: z.object({
    total: z.number().int(),
    page: z.number().int(),
    totalPages: z.number().int(),
    perPage: z.number().int(),
  }),
})