import prisma from '../lib/prismaClient.js'
import { computeEffectivePrice, pricingInclude } from './pricingService.js'

class NotFoundError extends Error {
  constructor(message) {
    super(message)
    this.status = 404
  }
}

class ConflictError extends Error {
  constructor(message) {
    super(message)
    this.status = 409
  }
}

const sortMap = {
  newest: { createdAt: 'desc' },
  // Nota: ordena pelo preço BASE, não pelo preço já com desconto — ordenar
  // pelo preço efetivo exigiria calcular a promoção em SQL (ou trazer tudo
  // para memória antes de ordenar). Para o tamanho deste catálogo não vale
  // a complexidade extra; fica documentado como simplificação consciente.
  price_asc: { priceCents: 'asc' },
  price_desc: { priceCents: 'desc' },
}

const productInclude = {
  category: true,
  images: { orderBy: { position: 'asc' } },
  ...pricingInclude,
}

// Achata o produto do Prisma para o formato que a API expõe: preço já
// calculado com promoção (se houver), imagens ordenadas, categoria só com
// o essencial.
function serializeProduct(product, now = new Date()) {
  const { priceCents, compareAtPriceCents, promotion } = computeEffectivePrice(product, now)

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    stock: product.stock,
    featured: product.featured,
    priceCents,
    compareAtPriceCents,
    promotion,
    images: product.images.map((img) => ({ id: img.id, url: img.url, position: img.position })),
    category: { id: product.category.id, name: product.category.name, slug: product.category.slug },
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  }
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
      include: productInclude,
    }),
    prisma.product.count({ where }),
  ])

  return {
    items: items.map((p) => serializeProduct(p)),
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
    include: productInclude,
  })

  if (!product) {
    throw new NotFoundError('Produto não encontrado')
  }

  return serializeProduct(product)
}

// Produtos "relacionados": mesma categoria, excluindo o próprio produto.
// Critério simples de propósito — cross-sell curado à mão (produtos que se
// complementam mas são de categorias diferentes) fica para uma iteração
// futura, precisaria de uma relação dedicada no schema.
export async function listRelatedProducts(productId, categoryId, limit = 4) {
  const products = await prisma.product.findMany({
    where: { categoryId, id: { not: productId } },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: productInclude,
  })
  return products.map((p) => serializeProduct(p))
}

export async function listFeaturedProducts(limit = 8) {
  const products = await prisma.product.findMany({
    where: { featured: true },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: productInclude,
  })
  return products.map((p) => serializeProduct(p))
}

export async function listCategories() {
  return prisma.category.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { products: true } } },
  })
}

// --- operações de escrita (só para o painel de admin) ---

export async function createProduct(data) {
  const category = await prisma.category.findUnique({ where: { id: data.categoryId } })
  if (!category) {
    throw new NotFoundError('Categoria não encontrada')
  }

  const existingSlug = await prisma.product.findUnique({ where: { slug: data.slug } })
  if (existingSlug) {
    throw new ConflictError('Já existe um produto com este slug')
  }

  const product = await prisma.product.create({ data, include: productInclude })
  return serializeProduct(product)
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

  const product = await prisma.product.update({ where: { id }, data, include: productInclude })
  return serializeProduct(product)
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
