// Calcula o preço efetivo de um produto, considerando promoções ativas.
// Isto é usado tanto na listagem/detalhe de produtos (para mostrar o preço
// com desconto) como no checkout (para cobrar o valor correto) — a mesma
// função em ambos os sítios garante que nunca mostramos um preço ao
// cliente diferente do que ele realmente paga.

// Uma promoção está "ativa" agora se a data atual cai dentro da janela
// [startsAt, endsAt].
function isPromotionActive(promotion, now = new Date()) {
  return promotion.startsAt <= now && promotion.endsAt >= now
}

// Recebe um produto com as relações `promotions` (específicas do produto) e
// `category.promotions` (promoções da categoria) já incluídas na query, e
// devolve a promoção ativa mais vantajosa (maior desconto), ou null.
export function getActivePromotion(product, now = new Date()) {
  const candidates = [...(product.promotions ?? []), ...(product.category?.promotions ?? [])]

  const active = candidates.filter((promo) => isPromotionActive(promo, now))
  if (active.length === 0) return null

  return active.reduce((best, promo) => (promo.discountPercent > best.discountPercent ? promo : best))
}

// Devolve { priceCents, compareAtPriceCents, promotion } — compareAtPriceCents
// só vem preenchido quando há desconto (para mostrar o preço "de/para").
export function computeEffectivePrice(product, now = new Date()) {
  const promotion = getActivePromotion(product, now)

  if (!promotion) {
    return { priceCents: product.priceCents, compareAtPriceCents: null, promotion: null }
  }

  const discounted = Math.round(product.priceCents * (1 - promotion.discountPercent / 100))

  return {
    priceCents: discounted,
    compareAtPriceCents: product.priceCents,
    promotion: {
      id: promotion.id,
      name: promotion.name,
      discountPercent: promotion.discountPercent,
    },
  }
}

// Inclui os campos do Prisma necessários para computeEffectivePrice
// funcionar — usar sempre este include ao ir buscar produtos que precisam
// de mostrar o preço efetivo.
export const pricingInclude = {
  promotions: true,
  category: { include: { promotions: true } },
}
