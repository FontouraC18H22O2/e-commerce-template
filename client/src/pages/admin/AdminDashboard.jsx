import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { listAdminProducts, listAdminPromotions, listAdminOrders } from '../../services/adminApi.js'
import { formatPrice } from '../../utils/format.js'
import { BoxIcon, TagIcon, ReceiptIcon } from '../../components/icons/index.jsx'

function isPromoActive(promo) {
  const now = new Date()
  return new Date(promo.startsAt) <= now && new Date(promo.endsAt) >= now
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    Promise.all([listAdminProducts(), listAdminPromotions(), listAdminOrders()]).then(
      ([{ products }, { promotions }, { orders }]) => {
        setStats({
          totalProducts: products.length,
          outOfStock: products.filter((p) => p.stock === 0).length,
          activePromotions: promotions.filter(isPromoActive).length,
          pendingOrders: orders.filter((o) => o.status === 'PENDING').length,
          revenue: orders.filter((o) => o.status === 'PAID').reduce((sum, o) => sum + o.totalCents, 0),
          recentOrders: orders.slice(0, 5),
        })
      },
    )
  }, [])

  if (!stats) return <p style={{ color: 'var(--color-ink-soft)' }}>A carregar...</p>

  const cards = [
    { label: 'Produtos', value: stats.totalProducts, icon: BoxIcon, to: '/admin/products', sub: stats.outOfStock > 0 ? `${stats.outOfStock} sem stock` : 'Todos com stock' },
    { label: 'Promoções ativas', value: stats.activePromotions, icon: TagIcon, to: '/admin/promotions' },
    { label: 'Encomendas pendentes', value: stats.pendingOrders, icon: ReceiptIcon, to: '/admin/orders' },
  ]

  return (
    <div>
      <div className="admin__header">
        <h1>Vista geral</h1>
      </div>

      <div className="admin-stats">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
          >
            <Link to={card.to} className="admin-stat-card">
              <div className="admin-stat-card__icon">
                <card.icon />
              </div>
              <p className="admin-stat-card__value">{card.value}</p>
              <p className="admin-stat-card__label">{card.label}</p>
              {card.sub && <p className="admin-stat-card__sub">{card.sub}</p>}
            </Link>
          </motion.div>
        ))}

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.15 }}>
          <div className="admin-stat-card admin-stat-card--accent">
            <p className="admin-stat-card__value">{formatPrice(stats.revenue)}</p>
            <p className="admin-stat-card__label">Receita (encomendas pagas)</p>
          </div>
        </motion.div>
      </div>

      <div className="admin-card">
        <h2>Encomendas recentes</h2>
        {stats.recentOrders.length === 0 ? (
          <p style={{ color: 'var(--color-ink-soft)' }}>Ainda não há encomendas.</p>
        ) : (
          <ul className="admin-recent-orders">
            {stats.recentOrders.map((order) => (
              <li key={order.id}>
                <span className="orders__id">#{order.id.slice(0, 8)}</span>
                <span>{order.user.name}</span>
                <span>{formatPrice(order.totalCents)}</span>
                <span className={`status-pill status-pill--${order.status.toLowerCase()}`}>{order.status}</span>
              </li>
            ))}
          </ul>
        )}
        <Link to="/admin/orders" className="btn--text">Ver todas as encomendas</Link>
      </div>
    </div>
  )
}
