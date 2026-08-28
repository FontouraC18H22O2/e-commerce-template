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
  forgotPassword,
  postResetPassword,
} from '../controllers/authController.js'
import { validate } from '../middleware/validate.js'
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from '../schemas/authSchemas.js'
import { updateProfileSchema, changeEmailSchema, changePasswordSchema } from '../schemas/profileSchemas.js'
import { authLimiter } from '../middleware/rateLimiters.js'
import { requireAuth } from '../middleware/requireAuth.js'

const router = Router()

router.post('/register', authLimiter, validate(registerSchema), register)
router.post('/login', authLimiter, validate(loginSchema), login)
router.post('/logout', logout)
router.get('/me', me)

// Mesmo rate limit do login — sem isto, alguém podia usar este endpoint
// para inundar a caixa de correio de outra pessoa com emails de reset.
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), forgotPassword)
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), postResetPassword)

router.get('/profile', requireAuth, getProfile)
router.put('/profile', requireAuth, validate(updateProfileSchema), putProfile)
// Email e password são sensíveis: mesmo rate limit do login/registo, para
// travar alguém a tentar adivinhar a password atual por força bruta.
router.put('/email', requireAuth, authLimiter, validate(changeEmailSchema), putEmail)
router.put('/password', requireAuth, authLimiter, validate(changePasswordSchema), putPassword)

export default router
