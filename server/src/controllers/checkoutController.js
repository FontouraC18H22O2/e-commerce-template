import { createOrderFromCart, listOrdersForUser } from '../services/orderService.js'

export async function checkout(req, res, next) {
  try {
    const { order, clientSecret } = await createOrderFromCart(req.session.userId, req.body.items)
    res.status(201).json({
      orderId: order.id,
      totalCents: order.totalCents,
      clientSecret,
    })
  } catch (err) {
    next(err)
  }
}

export async function getMyOrders(req, res, next) {
  try {
    const orders = await listOrdersForUser(req.session.userId)
    res.json({ orders })
  } catch (err) {
    next(err)
  }
}
