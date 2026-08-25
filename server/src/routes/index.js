import { Router } from 'express'
import authRoutes from './authRoutes.js'
import productRoutes from './productRoutes.js'
import checkoutRoutes from './checkoutRoutes.js'
import adminRoutes from './adminRoutes.js'

const router = Router()

// Rota simples para confirmar que a API está de pé (útil para health-checks
// de deploy e para testarmos a ligação a partir do frontend).
router.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

router.use('/auth', authRoutes)
router.use(productRoutes)
router.use(checkoutRoutes)
router.use('/admin', adminRoutes)

// O webhook da Stripe NÃO é montado aqui — precisa do corpo em bruto e é
// registado diretamente em app.js, antes do express.json() global.

export default router
