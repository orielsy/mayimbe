import { z } from 'zod'
import { localizedTextSchema } from '../shared/localized-text.ts'

export const personSchema = z.object({
  id: z.string().regex(/^person:[a-z0-9][a-z0-9-]*$/),
  type: z.literal('person'),
  slug: z.string().regex(/^[a-z0-9][a-z0-9-]*$/),
  name: z.string().min(1),
  aliases: z.array(z.string().min(1)).optional(),
  summary: localizedTextSchema.optional(),
})
