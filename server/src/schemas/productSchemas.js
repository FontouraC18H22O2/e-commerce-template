import { z } from 'zod'

export const listProductsQuerySchema = z.object({
  category: z.string().trim().min(1).max(100).optional(),
  search: z.string().trim().min(1).max(100).optional(),
  minPrice: z.coerce.number().int().nonnegative().optional(),
  maxPrice: z.coerce.number().int().nonnegative().optional(),
  sort: z.enum(['newest', 'price_asc', 'price_desc']).optional().default('newest'),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
})
