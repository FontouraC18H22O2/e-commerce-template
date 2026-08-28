import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { api } from '../../services/api.js'
import { listAdminPromotions, listAdminProducts, createAdminPromotion, updateAdminPromotion } from '../../services/adminApi.js'

// datetime-local pede "YYYY-MM-DDTHH:mm" em hora local — Date#toISOString()
// dá sempre UTC, por isso o ajuste manual do offset.
function toDatetimeLocal(isoString) {
  const date = new Date(isoString)
  const offsetMs = date.getTimezoneOffset() * 60 * 1000
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16)
}

const emptyForm = { name: '', description: '', discountPercent: '10', startsAt: '', endsAt: '', categoryId: '' }

export default function AdminPromotionForm() {
  const { id } = useParams()
  const isEditing = Boolean(id)
  const navigate = useNavigate()

  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [selectedProductIds, setSelectedProductIds] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(isEditing)

  useEffect(() => {
    api.get('/categories').then((data) => setCategories(data.categories))
    listAdminProducts().then((data) => setProducts(data.products))
  }, [])

  useEffect(() => {
    if (!isEditing) return
    listAdminPromotions()
      .then((data) => {
        const promo = data.promotions.find((p) => p.id === id)
        if (!promo) {
          setError('Promoção não encontrada')
          return
        }
        setForm({
          name: promo.name,
          description: promo.description ?? '',
          discountPercent: String(promo.discountPercent),
          startsAt: toDatetimeLocal(promo.startsAt),
          endsAt: toDatetimeLocal(promo.endsAt),
          categoryId: promo.categoryId ?? '',
        })
        setSelectedProductIds(promo.products.map((p) => p.id))
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  function handleChange(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function toggleProduct(productId) {
    setSelectedProductIds((prev) =>
      prev.includes(productId) ? prev.filter((pid) => pid !== productId) : [...prev, productId],
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const payload = {
      name: form.name,
      description: form.description || undefined,
      discountPercent: Number(form.discountPercent),
      startsAt: new Date(form.startsAt).toISOString(),
      endsAt: new Date(form.endsAt).toISOString(),
      categoryId: form.categoryId || null,
      productIds: selectedProductIds,
    }

    try {
      if (isEditing) {
        await updateAdminPromotion(id, payload)
      } else {
        await createAdminPromotion(payload)
      }
      navigate('/admin/promotions')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <p style={{ color: 'var(--color-ink-soft)' }}>A carregar...</p>

  return (
    <div>
      <div className="admin__header">
        <h1>{isEditing ? 'Editar promoção' : 'Nova promoção'}</h1>
        <Link to="/admin/promotions" className="btn--text">Voltar</Link>
      </div>

      <form onSubmit={handleSubmit} className="admin-form admin-card">
        <div className="field">
          <label htmlFor="name">Nome</label>
          <input id="name" className="input" required value={form.name} onChange={(e) => handleChange('name', e.target.value)} />
        </div>

        <div className="field">
          <label htmlFor="description">Descrição (texto do banner)</label>
          <input
            id="description"
            className="input"
            value={form.description}
            onChange={(e) => handleChange('description', e.target.value)}
            placeholder='Ex: "Até 20% em produtos selecionados"'
          />
        </div>

        <div className="admin-form__row">
          <div className="field">
            <label htmlFor="discount">Desconto (%)</label>
            <input
              id="discount"
              className="input"
              type="number"
              min="1"
              max="99"
              required
              value={form.discountPercent}
              onChange={(e) => handleChange('discountPercent', e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="category">Categoria (opcional)</label>
            <select id="category" value={form.categoryId} onChange={(e) => handleChange('categoryId', e.target.value)}>
              <option value="">Nenhuma</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="admin-form__row">
          <div className="field">
            <label htmlFor="startsAt">Início</label>
            <input
              id="startsAt"
              className="input"
              type="datetime-local"
              required
              value={form.startsAt}
              onChange={(e) => handleChange('startsAt', e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="endsAt">Fim</label>
            <input
              id="endsAt"
              className="input"
              type="datetime-local"
              required
              value={form.endsAt}
              onChange={(e) => handleChange('endsAt', e.target.value)}
            />
          </div>
        </div>

        <div className="field">
          <label>Produtos específicos (opcional, cumulativo com a categoria)</label>
          <div className="admin-form__checklist">
            {products.map((product) => (
              <label key={product.id} className="admin-form__checkbox">
                <input
                  type="checkbox"
                  checked={selectedProductIds.includes(product.id)}
                  onChange={() => toggleProduct(product.id)}
                />
                {product.name}
              </label>
            ))}
          </div>
        </div>

        {error && <p className="form-alert" role="alert">{error}</p>}

        <button type="submit" className="btn" disabled={submitting}>
          {submitting ? 'A guardar...' : isEditing ? 'Guardar alterações' : 'Criar promoção'}
        </button>
      </form>
    </div>
  )
}
