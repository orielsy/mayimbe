import { z } from 'zod'
import { localizedTextSchema } from '../shared/localized-text.ts'

export const storySchema = z.object({
  id: z.string().regex(/^story:[a-z0-9][a-z0-9-]*$/),
  type: z.literal('story'),
  slug: z.string().regex(/^[a-z0-9][a-z0-9-]*$/),
  status: z.enum(['draft', 'published']),
  language: z.enum(['en', 'es']),
  title: localizedTextSchema,
  summary: localizedTextSchema.optional(),
  references: z.array(z.string().min(1)).optional(),
  sources: z.array(z.string().min(1)).optional(),
  body: z.string().min(1),
})
