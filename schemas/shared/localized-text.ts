import { z } from 'zod'

export const localizedTextSchema = z.object({
  en: z.string().min(1).optional(),
  es: z.string().min(1).optional(),
})
