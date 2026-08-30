import { z } from 'zod'
import { localizedTextSchema } from '../shared/localized-text'

const destinationSchema = z.union([
  z.object({
    kind: z.literal('desk'),
  }),
  z.object({
    kind: z.literal('exhibit'),
    exhibit: z.string().min(1),
    target: z.unknown().optional(),
    entity: z.string().min(1).optional(),
  }),
])

export const experienceMappingSchema = z.object({
  id: z.string().regex(/^experience:[a-z0-9][a-z0-9-]*$/),
  subject: z.string().min(1),
  role: z.enum(['primary', 'alternate']),
  destination: destinationSchema,
  label: localizedTextSchema.optional(),
})
