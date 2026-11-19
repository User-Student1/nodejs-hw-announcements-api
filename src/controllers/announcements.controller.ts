import type { Request, Response } from 'express'
import createHttpError from 'http-errors'
import prisma from '../../prisma/client.ts'
import type { Prisma } from '../../generated/prisma/client.ts'
import type {
  CreateAnnouncementInput,
  UpdateAnnouncementInput,
  IdParam,
  ListQuery,
} from '../validators/announcements.validator.ts'

const PER_PAGE = 10

// Author fields that are safe to return (never the password)
const withAuthor = {
  user: {
    select: { id: true, username: true, email: true, name: true },
  },
} as const

// Ownership: does the announcement exist and belong to this user?
async function findOwnAnnouncement(id: number, userId: number) {
  const announcement = await prisma.announcement.findUnique({
    where: { id },
    select: { userId: true },
  })
  if (!announcement) {
    throw createHttpError(404, 'Announcement not found')
  }
  if (announcement.userId !== userId) {
    throw createHttpError(403, 'Access denied')
  }
}

// GET /announcements
export async function listAnnouncements(_req: Request, res: Response) {
  const { page, search, sort } = res.locals.query as ListQuery

  const where: Prisma.AnnouncementWhereInput = search
    ? { title: { contains: search, mode: 'insensitive' } }
    : {}

  const direction = sort === 'oldest' ? 'asc' : 'desc'

  const [data, total] = await Promise.all([
    prisma.announcement.findMany({
      where,
      include: withAuthor,
      omit: { userId: true },
      orderBy: [{ createdAt: direction }, { id: direction }],
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
    prisma.announcement.count({ where }),
  ])

  res.json({
    data,
    pagination: {
      total,
      page,
      totalPages: Math.ceil(total / PER_PAGE),
      perPage: PER_PAGE,
    },
  })
}

// GET /announcements/:id
export async function getAnnouncement(_req: Request, res: Response) {
  const { id } = res.locals.params as IdParam

  const announcement = await prisma.announcement.findUnique({
    where: { id },
    include: withAuthor,
      omit: { userId: true },
  })
  if (!announcement) {
    throw createHttpError(404, 'Announcement not found')
  }
  res.json(announcement)
}

// POST /announcements (protected)
export async function createAnnouncement(req: Request, res: Response) {
  const body = req.body as CreateAnnouncementInput

  const announcement = await prisma.announcement.create({
    data: { ...body, userId: req.user!.sub },
    include: withAuthor,
      omit: { userId: true },
  })
  res.status(201).json(announcement)
}

// PATCH /announcements/:id (protected + ownership)
export async function updateAnnouncement(req: Request, res: Response) {
  const { id } = res.locals.params as IdParam
  await findOwnAnnouncement(id, req.user!.sub)

  const announcement = await prisma.announcement.update({
    where: { id },
    data: req.body as UpdateAnnouncementInput,
    include: withAuthor,
      omit: { userId: true },
  })
  res.json(announcement)
}

// DELETE /announcements/:id (protected + ownership)
export async function deleteAnnouncement(req: Request, res: Response) {
  const { id } = res.locals.params as IdParam
  await findOwnAnnouncement(id, req.user!.sub)

  await prisma.announcement.delete({ where: { id } })
  res.status(204).end()
}