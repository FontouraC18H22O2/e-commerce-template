import { Router } from 'express'
import {
  register,
  login,
  logout,
  me,
  getProfile,
  putProfile,
  putEmail,
  putPassword,
} from '../controllers/authController.js'
import { validate } from '../middleware/validate.js'
import { registerSchema, loginSchema } from '../schemas/authSchemas.js'
import { updateProfileSchema, changeEmailSchema, changePasswordSchema } from '../schemas/profileSchemas.js'
import { authLimiter } from '../middleware/rateLimiters.js'
import { requireAuth } from '../middleware/requireAuth.js'

const router = Router()

router.post('/register', authLimiter, validate(registerSchema), register)
router.post('/login', authLimiter, validate(loginSchema), login)
router.post('/logout', logout)
router.get('/me', me)

router.get('/profile', requireAuth, getProfile)
router.put('/profile', requireAuth, validate(updateProfileSchema), putProfile)
// Email e password são sensíveis: mesmo rate limit do login/registo, para
// travar alguém a tentar adivinhar a password atual por força bruta.
router.put('/email', requireAuth, authLimiter, validate(changeEmailSchema), putEmail)
router.put('/password', requireAuth, authLimiter, validate(changePasswordSchema), putPassword)

export default router
