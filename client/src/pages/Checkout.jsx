import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { loadStripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'
import { api } from '../services/api.js'
import { useCart } from '../context/CartContext.jsx'
import CheckoutForm from '../components/CheckoutForm.jsx'
import { formatPrice } from '../utils/format.js'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)

export default function Checkout() {
  const { items, totalCents, clear } = useCart()
  const navigate = useNavigate()

  const [clientSecret, setClientSecret] = useState(null)
  const [orderId, setOrderId] = useState(null)
  const [error, setError] = useState(null)

  // Criar a encomenda é uma ação com efeito real (decrementa stock, cria um
  // PaymentIntent na Stripe) — não pode correr duas vezes. O StrictMode do
  // React 18 invoca deliberadamente os efeitos duas vezes em desenvolvimento
  // para apanhar exatamente este tipo de problema; sem esta guarda,
  // criávamos duas encomendas e descontávamos o stock a dobrar por cada
  // visita a esta página.
  const requestedRef = useRef(false)

  useEffect(() => {
    if (items.length === 0) return
    if (requestedRef.current) return
    requestedRef.current = true

    // O servidor recalcula o preço a partir da BD — o totalCents que
    // mostramos aqui antes da resposta é só uma pré-visualização otimista.
    api
      .post('/checkout', { items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })) })
      .then((data) => {
        setClientSecret(data.clientSecret)
        setOrderId(data.orderId)
      })
      .catch((err) => setError(err.message))
  }, [])

  function handleSuccess() {
    clear()
    navigate(`/orders/confirmation?orderId=${orderId}`)
  }

  if (items.length === 0) {
    return <p style={{ color: 'var(--color-ink-soft)' }}>O carrinho está vazio.</p>
  }

  if (error) {
    return <p className="form-alert" role="alert">{error}</p>
  }

  if (!clientSecret) {
    return <p style={{ color: 'var(--color-ink-soft)' }}>A preparar o pagamento...</p>
  }

  return (
    <motion.div className="checkout" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <p className="eyebrow">Checkout</p>
      <h1>Finalizar compra</h1>

      <div className="checkout__summary">
        <span className="cart__total-label">Total</span>
        <span className="cart__total-value">{formatPrice(totalCents)}</span>
      </div>

      <Elements stripe={stripePromise} options={{ clientSecret }}>
        <CheckoutForm orderId={orderId} onSuccess={handleSuccess} />
      </Elements>

      <p className="checkout__note">
        Modo de teste — usa o cartão 4242 4242 4242 4242, qualquer data futura e qualquer CVC.
      </p>
    </motion.div>
  )
}
