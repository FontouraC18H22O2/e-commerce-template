import { createProduct, updateProduct, deleteProduct } from '../services/productService.js'
import { listAllOrders, updateOrderStatus } from '../services/orderService.js'
import {
  listPromotions,
  createPromotion,
  updatePromotion,
  deletePromotion,
} from '../services/promotionService.js'

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

export async function getPromotions(req, res, next) {
  try {
    const promotions = await listPromotions()
    res.json({ promotions })
  } catch (err) {
    next(err)
  }
}

export async function postPromotion(req, res, next) {
  try {
    const promotion = await createPromotion(req.body)
    res.status(201).json({ promotion })
  } catch (err) {
    next(err)
  }
}

export async function putPromotion(req, res, next) {
  try {
    const promotion = await updatePromotion(req.params.id, req.body)
    res.json({ promotion })
  } catch (err) {
    next(err)
  }
}

export async function removePromotion(req, res, next) {
  try {
    await deletePromotion(req.params.id)
    res.status(204).end()
  } catch (err) {
    next(err)
  }
}
