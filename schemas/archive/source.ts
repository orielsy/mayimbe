import { z } from 'zod'

export const sourceSchema = z.object({
  id: z.string().regex(/^source:[a-z0-9][a-z0-9-]*$/),
  type: z.literal('source'),
  slug: z.string().regex(/^[a-z0-9][a-z0-9-]*$/),
  sourceType: z.enum(['website', 'article', 'book', 'interview', 'liner-notes', 'audio', 'video', 'other']),
  title: z.string().min(1),
  author: z.string().min(1).optional(),
  publication: z.string().min(1).optional(),
  url: z.string().url().optional(),
  accessedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  note: z.string().min(1).optional(),
})
