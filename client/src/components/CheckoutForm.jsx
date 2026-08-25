import { useState } from 'react'
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'

export default function CheckoutForm({ orderId, onSuccess }) {
  const stripe = useStripe()
  const elements = useElements()
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!stripe || !elements) return

    setSubmitting(true)
    setError(null)

    // redirect: 'if_required' evita sair da página quando o método de
    // pagamento não precisa de um passo extra fora do site (é o caso do
    // cartão de teste da Stripe) — só redireciona quando é mesmo preciso
    // (ex: métodos com autenticação 3D Secure).
    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    })

    if (stripeError) {
      setError(stripeError.message)
      setSubmitting(false)
      return
    }

    if (paymentIntent?.status === 'succeeded') {
      onSuccess(orderId)
    } else {
      setError('O pagamento não foi concluído.')
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PaymentElement />

      {error && <p className="form-alert" role="alert">{error}</p>}

      <button type="submit" className="btn btn--block" disabled={!stripe || submitting}>
        {submitting ? 'A processar...' : 'Pagar'}
      </button>
    </form>
  )
}
