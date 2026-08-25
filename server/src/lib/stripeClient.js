import Stripe from 'stripe'

// Cliente Stripe único, partilhado por toda a app. A chave secreta nunca
// sai daqui — é usada só no servidor.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export default stripe
