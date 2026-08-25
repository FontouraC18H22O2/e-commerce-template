import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function OrderConfirmation() {
  const [searchParams] = useSearchParams()
  const orderId = searchParams.get('orderId')

  return (
    <motion.div
      style={{ maxWidth: 480, margin: '0 auto', textAlign: 'center' }}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <p className="eyebrow">Confirmação</p>
      <h1>Encomenda confirmada</h1>
      <p>Obrigado pela tua compra.</p>
      {orderId && <p className="orders__id">#{orderId.slice(0, 8)}</p>}
      <p style={{ color: 'var(--color-ink-soft)' }}>
        O estado do pagamento é confirmado automaticamente pela Stripe (webhook). Podes acompanhar o estado em{' '}
        <Link to="/orders" style={{ textDecoration: 'underline' }}>As minhas encomendas</Link>.
      </p>
      <Link to="/" className="btn btn--outline">Voltar ao catálogo</Link>
    </motion.div>
  )
}
