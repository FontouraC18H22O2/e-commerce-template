import { z } from 'zod'

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export const createProductSchema = z.object({
  name: z.string().trim().min(2).max(200),
  slug: z.string().trim().min(2).max(200).regex(slugRegex, 'Slug inválido (usa só minúsculas, números e hífens)'),
  description: z.string().trim().min(1).max(2000),
  priceCents: z.coerce.number().int().positive('O preço tem de ser maior que zero'),
  stock: z.coerce.number().int().nonnegative(),
  imageUrl: z.string().trim().url().optional(),
  categoryId: z.string().uuid('categoryId inválido'),
})

// .partial() torna todos os campos opcionais — na edição só enviamos o que
// muda, mas cada campo enviado continua a ser validado com as mesmas regras.
export const updateProductSchema = createProductSchema.partial()

export const updateOrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'PAID', 'FAILED', 'SHIPPED', 'CANCELLED']),
})
