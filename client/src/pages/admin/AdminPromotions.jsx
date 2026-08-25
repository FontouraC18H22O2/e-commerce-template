import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listAdminPromotions, deleteAdminPromotion } from '../../services/adminApi.js'

function isActive(promo) {
  const now = new Date()
  return new Date(promo.startsAt) <= now && new Date(promo.endsAt) >= now
}

export default function AdminPromotions() {
  const [promotions, setPromotions] = useState(null)
  const [error, setError] = useState(null)

  function load() {
    listAdminPromotions()
      .then((data) => setPromotions(data.promotions))
      .catch((err) => setError(err.message))
  }

  useEffect(load, [])

  async function handleDelete(promo) {
    if (!confirm(`Apagar a promoção "${promo.name}"?`)) return
    try {
      await deleteAdminPromotion(promo.id)
      load()
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <div>
      <div className="admin__header">
        <h1>Promoções</h1>
        <Link to="/admin/promotions/new" className="btn">Nova promoção</Link>
      </div>

      {error && <p className="form-alert" role="alert">{error}</p>}
      {!promotions && !error && <p style={{ color: 'var(--color-ink-soft)' }}>A carregar...</p>}

      {promotions && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Desconto</th>
                <th>Aplica-se a</th>
                <th>Período</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {promotions.map((promo) => (
                <tr key={promo.id}>
                  <td>{promo.name}</td>
                  <td>{promo.discountPercent}%</td>
                  <td>
                    {promo.category ? `Categoria: ${promo.category.name}` : ''}
                    {promo.category && promo.products.length > 0 ? ' + ' : ''}
                    {promo.products.length > 0 ? `${promo.products.length} produto(s)` : ''}
                    {!promo.category && promo.products.length === 0 ? '—' : ''}
                  </td>
                  <td>
                    {new Date(promo.startsAt).toLocaleDateString('pt-PT')} — {new Date(promo.endsAt).toLocaleDateString('pt-PT')}
                  </td>
                  <td>
                    <span className={`status-pill ${isActive(promo) ? 'status-pill--paid' : 'status-pill--pending'}`}>
                      {isActive(promo) ? 'Ativa' : 'Inativa'}
                    </span>
                  </td>
                  <td className="admin-table__actions">
                    <Link to={`/admin/promotions/${promo.id}/edit`} className="btn--text">Editar</Link>
                    <button type="button" className="btn--text admin-table__danger" onClick={() => handleDelete(promo)}>
                      Apagar
                    </button>
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
