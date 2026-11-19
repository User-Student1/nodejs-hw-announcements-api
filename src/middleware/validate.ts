import type { Request, Response, NextFunction } from 'express'
import type { ZodType, ZodError } from 'zod'

// Turn Zod issues into a simple list: "title: Too small..."
function formatIssues(error: ZodError): string[] {
  return error.issues.map((issue) => {
    const field = issue.path.join('.')
    return field ? `${field}: ${issue.message}` : issue.message
  })
}

// Validate request body (JSON)
export function validateBody(schema: ZodType) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: { body: formatIssues(result.error) },
      })
      return
    }
    req.body = result.data
    next()
  }
}

// Validate route params (:id)
export function validateParams(schema: ZodType) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params)
    if (!result.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: { params: formatIssues(result.error) },
      })
      return
    }
    res.locals.params = result.data
    next()
  }
}

// Validate query params (?page=&search=)
export function validateQuery(schema: ZodType) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query)
    if (!result.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: { query: formatIssues(result.error) },
      })
      return
    }
    res.locals.query = result.data
    next()
  }
}