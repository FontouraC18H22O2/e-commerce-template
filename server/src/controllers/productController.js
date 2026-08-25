import {
  listProducts,
  getProductBySlug,
  listCategories,
  listFeaturedProducts,
  listRelatedProducts,
} from '../services/productService.js'
import { listActivePromotions } from '../services/promotionService.js'

export async function getProducts(req, res, next) {
  try {
    const result = await listProducts(req.validatedQuery)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

export async function getProduct(req, res, next) {
  try {
    const product = await getProductBySlug(req.params.slug)
    const relatedProducts = await listRelatedProducts(product.id, product.category.id)
    res.json({ product, relatedProducts })
  } catch (err) {
    next(err)
  }
}

export async function getCategories(req, res, next) {
  try {
    const categories = await listCategories()
    res.json({ categories })
  } catch (err) {
    next(err)
  }
}

export async function getFeaturedProducts(req, res, next) {
  try {
    const products = await listFeaturedProducts()
    res.json({ products })
  } catch (err) {
    next(err)
  }
}

export async function getPromotions(req, res, next) {
  try {
    const promotions = await listActivePromotions()
    res.json({ promotions })
  } catch (err) {
    next(err)
  }
}
