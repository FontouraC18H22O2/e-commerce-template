import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import session from 'express-session'

import { sessionStore } from './lib/sessionStore.js'
import routes from './routes/index.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'
import { handleStripeWebhook } from './controllers/webhookController.js'

const isProduction = process.env.NODE_ENV === 'production'

const app = express()

// Necessário para o cookie "Secure" funcionar corretamente atrás de um proxy
// (Railway, Vercel, etc.) em produção.
if (isProduction) {
  app.set('trust proxy', 1)
}

app.use(helmet())

// CORS restrito à origem do frontend, com credentials para o cookie de sessão
// poder ser enviado em pedidos cross-origin (frontend e backend em domínios
// separados).
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }),
)

// Tem de vir ANTES do express.json(): a verificação da assinatura da Stripe
// precisa do corpo do pedido em bruto (Buffer), não já convertido em objeto.
app.post(
  '/api/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  handleStripeWebhook,
)

app.use(express.json())

app.use(
  session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET,
    name: 'sid',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 dias
    },
  }),
)

app.use('/api', routes)

app.use(notFoundHandler)
app.use(errorHandler)

export default app
