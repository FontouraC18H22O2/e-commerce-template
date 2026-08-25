import prisma from '../lib/prismaClient.js'
import stripe from '../lib/stripeClient.js'

class OrderError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

// Cria a encomenda a partir do carrinho e gera o PaymentIntent da Stripe.
// Tudo o que é dinheiro/stock é recalculado aqui a partir da BD — o
// servidor nunca confia em preços ou totais vindos do cliente.
export async function createOrderFromCart(userId, items) {
  const order = await prisma.$transaction(async (tx) => {
    const productIds = items.map((item) => item.productId)
    const products = await tx.product.findMany({ where: { id: { in: productIds } } })
    const productById = new Map(products.map((p) => [p.id, p]))

    let totalCents = 0
    const orderItemsData = []

    for (const item of items) {
      const product = productById.get(item.productId)

      if (!product) {
        throw new OrderError(`Produto não encontrado: ${item.productId}`, 400)
      }
      if (product.stock < item.quantity) {
        throw new OrderError(`Stock insuficiente para "${product.name}"`, 409)
      }

      totalCents += product.priceCents * item.quantity
      orderItemsData.push({
        productId: product.id,
        quantity: item.quantity,
        unitPriceCents: product.priceCents,
      })
    }

    const createdOrder = await tx.order.create({
      data: {
        userId,
        totalCents,
        status: 'PENDING',
        items: { create: orderItemsData },
      },
      include: { items: true },
    })

    // Reserva o stock já nesta fase — evita duas pessoas comprarem a última
    // unidade em simultâneo. Se o pagamento falhar, devolvemos o stock
    // (ver handleFailedPayment no webhook).
    for (const item of items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      })
    }

    return createdOrder
  })

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: order.totalCents,
      currency: 'eur',
      metadata: { orderId: order.id },
      // Só cartão por agora — mantém o checkout simples de usar e de testar.
      // Mais tarde dá para reativar automatic_payment_methods (MB WAY,
      // Klarna, etc.) se fizer sentido para o público-alvo da loja.
      payment_method_types: ['card'],
    })

    await prisma.order.update({
      where: { id: order.id },
      data: { stripePaymentIntentId: paymentIntent.id },
    })

    return { order, clientSecret: paymentIntent.client_secret }
  } catch (err) {
    // A criação do PaymentIntent falhou depois de já termos reservado stock
    // e criado a encomenda — desfazemos as duas coisas para não bloquear
    // stock indefinidamente por uma encomenda que nunca vai ser paga.
    await restoreStockAndFail(order.id)
    throw err
  }
}

async function restoreStockAndFail(orderId) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  })
  if (!order || order.status !== 'PENDING') return

  await prisma.$transaction([
    ...order.items.map((item) =>
      prisma.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      }),
    ),
    prisma.order.update({ where: { id: order.id }, data: { status: 'FAILED' } }),
  ])
}

export async function markOrderPaid(paymentIntentId) {
  const order = await prisma.order.findUnique({ where: { stripePaymentIntentId: paymentIntentId } })
  // Idempotente: o webhook da Stripe pode chamar-nos mais do que uma vez
  // para o mesmo evento — só atualizamos se ainda estiver PENDING.
  if (!order || order.status !== 'PENDING') return

  await prisma.order.update({ where: { id: order.id }, data: { status: 'PAID' } })
}

export async function markOrderFailed(paymentIntentId) {
  const order = await prisma.order.findUnique({ where: { stripePaymentIntentId: paymentIntentId } })
  if (!order || order.status !== 'PENDING') return

  await restoreStockAndFail(order.id)
}

export async function listOrdersForUser(userId) {
  return prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: { items: { include: { product: true } } },
  })
}

// --- operações de admin ---

export async function listAllOrders() {
  return prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, name: true, email: true } },
      items: { include: { product: true } },
    },
  })
}

export async function updateOrderStatus(orderId, status) {
  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (!order) {
    throw new OrderError('Encomenda não encontrada', 404)
  }
  return prisma.order.update({ where: { id: orderId }, data: { status } })
}
