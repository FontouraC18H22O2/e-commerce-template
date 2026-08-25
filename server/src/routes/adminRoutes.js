import { Router } from 'express'
import {
  getProducts,
  getProduct,
  postProduct,
  putProduct,
  removeProduct,
  getAllOrders,
  patchOrderStatus,
  getPromotions,
  postPromotion,
  putPromotion,
  removePromotion,
  postProductImage,
  deleteProductImage,
  putProductImagesOrder,
} from '../controllers/adminController.js'
import { validate } from '../middleware/validate.js'
import {
  createProductSchema,
  updateProductSchema,
  updateOrderStatusSchema,
  createPromotionSchema,
  updatePromotionSchema,
  reorderImagesSchema,
} from '../schemas/adminSchemas.js'
import { requireAuth, requireAdmin } from '../middleware/requireAuth.js'
import { uploadSingleImage } from '../middleware/upload.js'

const router = Router()

// Todas as rotas deste router exigem sessão de administrador — aplicado
// uma vez aqui, em vez de repetir os dois middlewares em cada rota abaixo.
router.use(requireAuth, requireAdmin)

router.get('/products', getProducts)
router.get('/products/:id', getProduct)
router.post('/products', validate(createProductSchema), postProduct)
router.put('/products/:id', validate(updateProductSchema), putProduct)
router.delete('/products/:id', removeProduct)

router.post('/products/:id/images', uploadSingleImage('image'), postProductImage)
router.delete('/products/:id/images/:imageId', deleteProductImage)
router.put('/products/:id/images/order', validate(reorderImagesSchema), putProductImagesOrder)

router.get('/orders', getAllOrders)
router.patch('/orders/:id/status', validate(updateOrderStatusSchema), patchOrderStatus)

router.get('/promotions', getPromotions)
router.post('/promotions', validate(createPromotionSchema), postPromotion)
router.put('/promotions/:id', validate(updatePromotionSchema), putPromotion)
router.delete('/promotions/:id', removePromotion)

export default router
