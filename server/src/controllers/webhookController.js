import stripe from '../lib/stripeClient.js'
import { markOrderPaid, markOrderFailed } from '../services/orderService.js'

// Recebe eventos da Stripe. A verificação da assinatura garante que o
// pedido veio mesmo da Stripe e não foi forjado por alguém a chamar este
// endpoint diretamente a inventar "pagamento aprovado". Por isso o corpo
// tem de chegar em bruto (Buffer), não já convertido em JSON — ver o
// middleware express.raw() montado só nesta rota, em app.js.
export async function handleStripeWebhook(req, res) {
  const signature = req.headers['stripe-signature']

  let event
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('Assinatura de webhook inválida:', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  switch (event.type) {
    case 'payment_intent.succeeded':
      await markOrderPaid(event.data.object.id)
      break
    case 'payment_intent.payment_failed':
      await markOrderFailed(event.data.object.id)
      break
    default:
      // Outros eventos não nos interessam por agora — ignoramos sem erro.
      break
  }

  res.json({ received: true })
}
