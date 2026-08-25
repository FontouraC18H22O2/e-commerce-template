import rateLimit from 'express-rate-limit'

// Trava tentativas repetidas de login/registo (brute-force, credential
// stuffing). 10 pedidos por IP a cada 15 minutos é generoso para um
// utilizador real que se engana na password, mas travador para um ataque.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas tentativas. Tenta novamente mais tarde.' },
})
