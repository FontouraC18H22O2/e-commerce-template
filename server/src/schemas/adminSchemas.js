import { z } from 'zod'

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export const createProductSchema = z.object({
  name: z.string().trim().min(2).max(200),
  slug: z.string().trim().min(2).max(200).regex(slugRegex, 'Slug inválido (usa só minúsculas, números e hífens)'),
  description: z.string().trim().min(1).max(2000),
  priceCents: z.coerce.number().int().positive('O preço tem de ser maior que zero'),
  stock: z.coerce.number().int().nonnegative(),
  featured: z.coerce.boolean().optional(),
  categoryId: z.string().uuid('categoryId inválido'),
})

export const createPromotionSchema = z
  .object({
    name: z.string().trim().min(2).max(150),
    description: z.string().trim().max(300).optional(),
    discountPercent: z.coerce.number().int().min(1).max(99),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
    categoryId: z.string().uuid().optional(),
    productIds: z.array(z.string().uuid()).optional().default([]),
  })
  .refine((data) => data.endsAt > data.startsAt, {
    message: 'A data de fim tem de ser depois da data de início',
    path: ['endsAt'],
  })

export const updatePromotionSchema = z.object({
  name: z.string().trim().min(2).max(150).optional(),
  description: z.string().trim().max(300).optional(),
  discountPercent: z.coerce.number().int().min(1).max(99).optional(),
  startsAt: z.coerce.date().optional(),
  endsAt: z.coerce.date().optional(),
  categoryId: z.string().uuid().nullable().optional(),
  productIds: z.array(z.string().uuid()).optional(),
})

// .partial() torna todos os campos opcionais — na edição só enviamos o que
// muda, mas cada campo enviado continua a ser validado com as mesmas regras.
export const updateProductSchema = createProductSchema.partial()

export const updateOrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'PAID', 'FAILED', 'SHIPPED', 'CANCELLED']),
})
