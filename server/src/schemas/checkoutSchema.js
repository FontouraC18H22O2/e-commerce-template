import { z } from 'zod'

// Repara no que NÃO pedimos aqui: preço. O cliente só manda o produto e a
// quantidade — o preço real vem sempre da base de dados no momento da
// compra, nunca do que o frontend diz que é o preço.
export const checkoutSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().uuid('productId inválido'),
        quantity: z.coerce.number().int().min(1).max(99),
      }),
    )
    .min(1, 'O carrinho está vazio'),
})
