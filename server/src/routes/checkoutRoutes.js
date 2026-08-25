import { Router } from 'express'
import { checkout, getMyOrders } from '../controllers/checkoutController.js'
import { validate } from '../middleware/validate.js'
import { checkoutSchema } from '../schemas/checkoutSchema.js'
import { requireAuth } from '../middleware/requireAuth.js'

const router = Router()

// Checkout exige sessão: uma Order pertence sempre a um User no nosso
// schema, e assim também temos histórico de encomendas por utilizador.
router.post('/checkout', requireAuth, validate(checkoutSchema), checkout)
router.get('/orders/me', requireAuth, getMyOrders)

export default router
