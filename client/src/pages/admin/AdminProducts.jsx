import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listAdminProducts, deleteAdminProduct } from '../../services/adminApi.js'
import { formatPrice } from '../../utils/format.js'

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
                <th>Nome</th>
                <th>Categoria</th>
                <th>Preço</th>
                <th>Stock</th>
                <th>Destaque</th>
                <th>Imagens</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>{product.name}</td>
                  <td>{product.category.name}</td>
                  <td>{formatPrice(product.priceCents)}</td>
                  <td>{product.stock}</td>
                  <td>{product.featured ? 'Sim' : '—'}</td>
                  <td>{product.images.length}</td>
                  <td className="admin-table__actions">
                    <Link to={`/admin/products/${product.id}/edit`} className="btn--text">Editar</Link>
                    <button type="button" className="btn--text admin-table__danger" onClick={() => handleDelete(product)}>
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
