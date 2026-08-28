import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listAdminProducts, deleteAdminProduct } from '../../services/adminApi.js'
import { formatPrice } from '../../utils/format.js'
import { PencilIcon, TrashIcon } from '../../components/icons/index.jsx'

export default function AdminProducts() {
  const [products, setProducts] = useState(null)
  const [error, setError] = useState(null)

  function load() {
    listAdminProducts()
      .then((data) => setProducts(data.products))
      .catch((err) => setError(err.message))
  }

  useEffect(load, [])

  async function handleDelete(product) {
    if (!confirm(`Apagar "${product.name}"? Esta ação não pode ser desfeita.`)) return
    try {
      await deleteAdminProduct(product.id)
      load()
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <div>
      <div className="admin__header">
        <h1>Produtos</h1>
        <Link to="/admin/products/new" className="btn">Novo produto</Link>
      </div>

      {error && <p className="form-alert" role="alert">{error}</p>}
      {!products && !error && <p style={{ color: 'var(--color-ink-soft)' }}>A carregar...</p>}

      {products && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th></th>
                <th>Nome</th>
                <th>Categoria</th>
                <th>Preço</th>
                <th>Stock</th>
                <th>Destaque</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>
                    <div className="admin-table__thumb">
                      {product.images[0] ? (
                        <img src={product.images[0].url} alt="" />
                      ) : (
                        <div className="product-card__placeholder" />
                      )}
                    </div>
                  </td>
                  <td>{product.name}</td>
                  <td>{product.category.name}</td>
                  <td>{formatPrice(product.priceCents)}</td>
                  <td>{product.stock}</td>
                  <td>{product.featured ? <span className="status-pill status-pill--paid">Sim</span> : '—'}</td>
                  <td className="admin-table__actions">
                    <Link to={`/admin/products/${product.id}/edit`} className="admin-table__icon-btn" aria-label="Editar">
                      <PencilIcon />
                    </Link>
                    <button
                      type="button"
                      className="admin-table__icon-btn admin-table__icon-btn--danger"
                      onClick={() => handleDelete(product)}
                      aria-label="Apagar"
                    >
                      <TrashIcon />
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
