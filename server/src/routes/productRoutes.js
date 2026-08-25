import { Router } from 'express'
import {
  getProducts,
  getProduct,
  getCategories,
  getFeaturedProducts,
  getPromotions,
} from '../controllers/productController.js'
import { validate } from '../middleware/validate.js'
import { listProductsQuerySchema } from '../schemas/productSchemas.js'

const router = Router()

// Rotas mais específicas antes de "/products/:slug", senão "featured"
// seria interpretado como um slug de produto.
router.get('/products/featured', getFeaturedProducts)
router.get('/products', validate(listProductsQuerySchema, 'query'), getProducts)
router.get('/products/:slug', getProduct)
router.get('/categories', getCategories)
router.get('/promotions', getPromotions)

export default router
