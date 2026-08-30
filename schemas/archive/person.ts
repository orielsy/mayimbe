import { z } from 'zod'

export const localizedTextSchema = z.object({
  en: z.string().min(1).optional(),
  es: z.string().min(1).optional(),
})

export const personSchema = z.object({
  id: z.string().regex(/^person:[a-z0-9][a-z0-9-]*$/),
  type: z.literal('person'),
  slug: z.string().regex(/^[a-z0-9][a-z0-9-]*$/),
  name: z.string().min(1),
  aliases: z.array(z.string().min(1)).optional(),
  summary: localizedTextSchema.optional(),
})
