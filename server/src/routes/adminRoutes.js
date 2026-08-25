import { Router } from 'express'
import {
  postProduct,
  putProduct,
  removeProduct,
  getAllOrders,
  patchOrderStatus,
  getPromotions,
  postPromotion,
  putPromotion,
  removePromotion,
} from '../controllers/adminController.js'
import { validate } from '../middleware/validate.js'
import {
  createProductSchema,
  updateProductSchema,
  updateOrderStatusSchema,
  createPromotionSchema,
  updatePromotionSchema,
} from '../schemas/adminSchemas.js'
import { requireAuth, requireAdmin } from '../middleware/requireAuth.js'

const router = Router()

// Todas as rotas deste router exigem sessão de administrador — aplicado
// uma vez aqui, em vez de repetir os dois middlewares em cada rota abaixo.
router.use(requireAuth, requireAdmin)

router.post('/products', validate(createProductSchema), postProduct)
router.put('/products/:id', validate(updateProductSchema), putProduct)
router.delete('/products/:id', removeProduct)

router.get('/orders', getAllOrders)
router.patch('/orders/:id/status', validate(updateOrderStatusSchema), patchOrderStatus)

router.get('/promotions', getPromotions)
router.post('/promotions', validate(createPromotionSchema), postPromotion)
router.put('/promotions/:id', validate(updatePromotionSchema), putPromotion)
router.delete('/promotions/:id', removePromotion)

export default router
