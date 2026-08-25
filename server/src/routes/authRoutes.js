import { Router } from 'express'
import { register, login, logout, me } from '../controllers/authController.js'
import { validate } from '../middleware/validate.js'
import { registerSchema, loginSchema } from '../schemas/authSchemas.js'
import { authLimiter } from '../middleware/rateLimiters.js'

const router = Router()

router.post('/register', authLimiter, validate(registerSchema), register)
router.post('/login', authLimiter, validate(loginSchema), login)
router.post('/logout', logout)
router.get('/me', me)

export default router
