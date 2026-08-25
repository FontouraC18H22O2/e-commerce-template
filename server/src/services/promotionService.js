import prisma from '../lib/prismaClient.js'

class NotFoundError extends Error {
  constructor(message) {
    super(message)
    this.status = 404
  }
}

class ValidationError extends Error {
  constructor(message) {
    super(message)
    this.status = 400
  }
}

const promotionInclude = {
  category: { select: { id: true, name: true, slug: true } },
  products: { select: { id: true, name: true, slug: true } },
}

// Para o banner público — só as promoções ativas agora, sem os detalhes
// de admin (não precisamos de saber a que produtos exatos se aplica só
// para mostrar o banner).
export async function listActivePromotions(now = new Date()) {
  return prisma.promotion.findMany({
    where: { startsAt: { lte: now }, endsAt: { gte: now } },
    include: { category: { select: { id: true, name: true, slug: true } } },
    orderBy: { discountPercent: 'desc' },
  })
}

// --- admin ---

export async function listPromotions() {
  return prisma.promotion.findMany({
    orderBy: { startsAt: 'desc' },
    include: promotionInclude,
  })
}

export async function createPromotion({ categoryId, productIds, ...data }) {
  if (categoryId) {
    const category = await prisma.category.findUnique({ where: { id: categoryId } })
    if (!category) throw new NotFoundError('Categoria não encontrada')
  }

  try {
    return await prisma.promotion.create({
      data: {
        ...data,
        ...(categoryId ? { category: { connect: { id: categoryId } } } : {}),
        ...(productIds.length > 0 ? { products: { connect: productIds.map((id) => ({ id })) } } : {}),
      },
      include: promotionInclude,
    })
  } catch (err) {
    if (err.code === 'P2025') {
      throw new ValidationError('Um ou mais productIds não existem')
    }
    throw err
  }
}

export async function updatePromotion(id, { categoryId, productIds, ...data }) {
  await getPromotionById(id)

  if (categoryId) {
    const category = await prisma.category.findUnique({ where: { id: categoryId } })
    if (!category) throw new NotFoundError('Categoria não encontrada')
  }

  try {
    return await prisma.promotion.update({
      where: { id },
      data: {
        ...data,
        // categoryId pode vir null explicitamente para remover a associação.
        ...(categoryId !== undefined ? { category: categoryId ? { connect: { id: categoryId } } : { disconnect: true } } : {}),
        // productIds substitui sempre a lista toda (set), nunca acumula.
        ...(productIds !== undefined ? { products: { set: productIds.map((pid) => ({ id: pid })) } } : {}),
      },
      include: promotionInclude,
    })
  } catch (err) {
    if (err.code === 'P2025') {
      throw new ValidationError('Um ou mais productIds não existem')
    }
    throw err
  }
}

export async function deletePromotion(id) {
  await getPromotionById(id)
  await prisma.promotion.delete({ where: { id } })
}

async function getPromotionById(id) {
  const promotion = await prisma.promotion.findUnique({ where: { id } })
  if (!promotion) {
    throw new NotFoundError('Promoção não encontrada')
  }
  return promotion
}
