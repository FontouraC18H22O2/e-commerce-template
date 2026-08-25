import { createProduct, updateProduct, deleteProduct } from '../services/productService.js'
import { listAllOrders, updateOrderStatus } from '../services/orderService.js'

export async function postProduct(req, res, next) {
  try {
    const product = await createProduct(req.body)
    res.status(201).json({ product })
  } catch (err) {
    next(err)
  }
}

export async function putProduct(req, res, next) {
  try {
    const product = await updateProduct(req.params.id, req.body)
    res.json({ product })
  } catch (err) {
    next(err)
  }
}

export async function removeProduct(req, res, next) {
  try {
    await deleteProduct(req.params.id)
    res.status(204).end()
  } catch (err) {
    next(err)
  }
}

export async function getAllOrders(req, res, next) {
  try {
    const orders = await listAllOrders()
    res.json({ orders })
  } catch (err) {
    next(err)
  }
}

export async function patchOrderStatus(req, res, next) {
  try {
    const order = await updateOrderStatus(req.params.id, req.body.status)
    res.json({ order })
  } catch (err) {
    next(err)
  }
}
