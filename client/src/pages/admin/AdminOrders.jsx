import { useEffect, useState } from 'react'
import { listAdminOrders, updateOrderStatus } from '../../services/adminApi.js'
import { formatPrice } from '../../utils/format.js'

const statuses = ['PENDING', 'PAID', 'FAILED', 'SHIPPED', 'CANCELLED']
const statusLabels = {
  PENDING: 'Pendente',
  PAID: 'Pago',
  FAILED: 'Falhou',
  SHIPPED: 'Enviado',
  CANCELLED: 'Cancelado',
}

export default function AdminOrders() {
  const [orders, setOrders] = useState(null)
  const [error, setError] = useState(null)
  const [updatingId, setUpdatingId] = useState(null)

  function load() {
    listAdminOrders()
      .then((data) => setOrders(data.orders))
      .catch((err) => setError(err.message))
  }

  useEffect(load, [])

  async function handleStatusChange(orderId, status) {
    setUpdatingId(orderId)
    try {
      await updateOrderStatus(orderId, status)
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)))
    } catch (err) {
      alert(err.message)
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div>
      <div className="admin__header">
        <h1>Encomendas</h1>
      </div>

      {error && <p className="form-alert" role="alert">{error}</p>}
      {!orders && !error && <p style={{ color: 'var(--color-ink-soft)' }}>A carregar...</p>}
      {orders && orders.length === 0 && <p style={{ color: 'var(--color-ink-soft)' }}>Ainda não há encomendas.</p>}

      {orders && orders.length > 0 && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Encomenda</th>
                <th>Cliente</th>
                <th>Itens</th>
                <th>Total</th>
                <th>Data</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="orders__id">#{order.id.slice(0, 8)}</td>
                  <td>
                    {order.user.name}
                    <br />
                    <span style={{ color: 'var(--color-ink-soft)', fontSize: '0.8em' }}>{order.user.email}</span>
                  </td>
                  <td>{order.items.reduce((sum, i) => sum + i.quantity, 0)}</td>
                  <td>{formatPrice(order.totalCents)}</td>
                  <td>{new Date(order.createdAt).toLocaleDateString('pt-PT')}</td>
                  <td>
                    <select
                      value={order.status}
                      disabled={updatingId === order.id}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                    >
                      {statuses.map((s) => (
                        <option key={s} value={s}>{statusLabels[s]}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
