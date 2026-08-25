import prisma from '../lib/prismaClient.js'

class NotFoundError extends Error {
  constructor(message) {
    super(message)
    this.status = 404
  }
}

const sortMap = {
  newest: { createdAt: 'desc' },
  price_asc: { priceCents: 'asc' },
  price_desc: { priceCents: 'desc' },
}

export async function listProducts({ category, search, minPrice, maxPrice, sort, page, limit }) {
  const where = {
    ...(category ? { category: { slug: category } } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
    ...(minPrice !== undefined || maxPrice !== undefined
      ? {
          priceCents: {
            ...(minPrice !== undefined ? { gte: minPrice } : {}),
            ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
          },
        }
      : {}),
  }

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: sortMap[sort],
      skip: (page - 1) * limit,
      take: limit,
      include: { category: true },
    }),
    prisma.product.count({ where }),
  ])

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

export async function getProductBySlug(slug) {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: { category: true },
  })

  if (!product) {
    throw new NotFoundError('Produto não encontrado')
  }

  return product
}

export async function listCategories() {
  return prisma.category.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { products: true } } },
  })
}

// --- operações de escrita (só para o painel de admin) ---

class ConflictError extends Error {
  constructor(message) {
    super(message)
    this.status = 409
  }
}

export async function createProduct(data) {
  const category = await prisma.category.findUnique({ where: { id: data.categoryId } })
  if (!category) {
    throw new NotFoundError('Categoria não encontrada')
  }

  const existingSlug = await prisma.product.findUnique({ where: { slug: data.slug } })
  if (existingSlug) {
    throw new ConflictError('Já existe um produto com este slug')
  }

  return prisma.product.create({ data, include: { category: true } })
}

export async function updateProduct(id, data) {
  await getProductById(id)

  if (data.categoryId) {
    const category = await prisma.category.findUnique({ where: { id: data.categoryId } })
    if (!category) {
      throw new NotFoundError('Categoria não encontrada')
    }
  }

  if (data.slug) {
    const existingSlug = await prisma.product.findUnique({ where: { slug: data.slug } })
    if (existingSlug && existingSlug.id !== id) {
      throw new ConflictError('Já existe um produto com este slug')
    }
  }

  return prisma.product.update({ where: { id }, data, include: { category: true } })
}

export async function deleteProduct(id) {
  await getProductById(id)

  try {
    await prisma.product.delete({ where: { id } })
  } catch (err) {
    // P2003: violação de foreign key — o produto está referenciado em
    // order_items (já foi comprado alguma vez). Não faz sentido apagar
    // produtos com histórico de encomendas: perderíamos o registo do que
    // foi vendido. Em vez disso, o admin deve pôr o stock a 0.
    if (err.code === 'P2003') {
      throw new ConflictError(
        'Não é possível apagar um produto com encomendas associadas. Podes pôr o stock a 0 em vez disso.',
      )
    }
    throw err
  }
}

async function getProductById(id) {
  const product = await prisma.product.findUnique({ where: { id } })
  if (!product) {
    throw new NotFoundError('Produto não encontrado')
  }
  return product
}
