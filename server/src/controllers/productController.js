import { listProducts, getProductBySlug, listCategories } from '../services/productService.js'

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
    res.json({ product })
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
