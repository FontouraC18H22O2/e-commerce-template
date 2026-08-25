import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { api } from '../services/api.js'
import { formatPrice } from '../utils/format.js'

const statusLabels = {
  PENDING: 'Pendente',
  PAID: 'Pago',
  FAILED: 'Falhou',
  SHIPPED: 'Enviado',
  CANCELLED: 'Cancelado',
}

const statusClass = {
  PENDING: 'status-pill--pending',
  PAID: 'status-pill--paid',
  FAILED: 'status-pill--failed',
  SHIPPED: 'status-pill--shipped',
  CANCELLED: 'status-pill--cancelled',
}

export default function Orders() {
  const [orders, setOrders] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    api
      .get('/orders/me')
      .then((data) => setOrders(data.orders))
      .catch(() => setError('Não foi possível carregar as encomendas.'))
  }, [])

  if (error) return <p className="form-alert" role="alert">{error}</p>
  if (!orders) return <p style={{ color: 'var(--color-ink-soft)' }}>A carregar...</p>

  return (
    <div>
      <p className="eyebrow">Conta</p>
      <h1>As minhas encomendas</h1>

      {orders.length === 0 ? (
        <p style={{ color: 'var(--color-ink-soft)' }}>Ainda não tens encomendas.</p>
      ) : (
        <ul className="orders__list">
          {orders.map((order, i) => (
            <motion.li
              key={order.id}
              className="orders__item"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i * 0.05 }}
            >
              <div className="orders__head">
                <span className="orders__id">#{order.id.slice(0, 8)}</span>
                <span className={`status-pill ${statusClass[order.status]}`}>{statusLabels[order.status]}</span>
              </div>
              <p className="orders__date">{new Date(order.createdAt).toLocaleDateString('pt-PT')}</p>
              <ul className="orders__items">
                {order.items.map((item) => (
                  <li key={item.id}>
                    {item.quantity}x {item.product.name} — {formatPrice(item.unitPriceCents * item.quantity)}
                  </li>
                ))}
              </ul>
              <p className="orders__total">Total: {formatPrice(order.totalCents)}</p>
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  )
}
