import { Router } from 'express'
import { getProducts, getProduct, getCategories } from '../controllers/productController.js'
import { validate } from '../middleware/validate.js'
import { listProductsQuerySchema } from '../schemas/productSchemas.js'

const router = Router()

router.get('/products', validate(listProductsQuerySchema, 'query'), getProducts)
router.get('/products/:slug', getProduct)
router.get('/categories', getCategories)

export default router
