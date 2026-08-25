import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { api } from '../../services/api.js'
import { getAdminProduct, createAdminProduct, updateAdminProduct } from '../../services/adminApi.js'
import ProductImageManager from '../../components/admin/ProductImageManager.jsx'

const emptyForm = {
  name: '',
  slug: '',
  description: '',
  price: '',
  stock: '0',
  brand: '',
  model: '',
  colors: '',
  featured: false,
  categoryId: '',
}

export default function AdminProductForm() {
  const { id } = useParams()
  const isEditing = Boolean(id)
  const navigate = useNavigate()

  const [categories, setCategories] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [images, setImages] = useState([])
  const [productId, setProductId] = useState(id ?? null)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(isEditing)

  useEffect(() => {
    api.get('/categories').then((data) => setCategories(data.categories))
  }, [])

  useEffect(() => {
    if (!isEditing) return
    getAdminProduct(id)
      .then((data) => {
        const p = data.product
        setForm({
          name: p.name,
          slug: p.slug,
          description: p.description,
          price: (p.priceCents / 100).toFixed(2),
          stock: String(p.stock),
          brand: p.brand ?? '',
          model: p.model ?? '',
          colors: (p.colors ?? []).join(', '),
          featured: p.featured,
          categoryId: p.categoryId,
        })
        setImages(p.images)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  function handleChange(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  // Gera o slug automaticamente a partir do nome, só enquanto o admin ainda
  // não tocou manualmente no campo slug (evita sobrepor uma edição manual).
  const [slugTouched, setSlugTouched] = useState(isEditing)
  function handleNameChange(value) {
    handleChange('name', value)
    if (!slugTouched) {
      const slug = value
        .toLowerCase()
        .normalize('NFD')
        .replace(new RegExp('[̀-ͯ]', 'g'), '') // remove acentos (e -> e, a -> a...)
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
      handleChange('slug', slug)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const payload = {
      name: form.name,
      slug: form.slug,
      description: form.description,
      priceCents: Math.round(Number(form.price) * 100),
      stock: Number(form.stock),
      brand: form.brand,
      model: form.model,
      // "Preto, Branco, Azul" -> ["Preto", "Branco", "Azul"]
      colors: form.colors
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean),
      featured: form.featured,
      categoryId: form.categoryId,
    }

    try {
      if (isEditing) {
        await updateAdminProduct(id, payload)
      } else {
        const { product } = await createAdminProduct(payload)
        // Depois de criado, ficamos na mesma página (agora em modo edição)
        // para o admin poder logo a seguir adicionar as imagens.
        setProductId(product.id)
        navigate(`/admin/products/${product.id}/edit`, { replace: true })
      }
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
        <h1>{isEditing ? 'Editar produto' : 'Novo produto'}</h1>
        <Link to="/admin/products" className="btn--text">Voltar</Link>
      </div>

      <form onSubmit={handleSubmit} className="admin-form">
        <div className="field">
          <label htmlFor="name">Nome</label>
          <input id="name" className="input" required value={form.name} onChange={(e) => handleNameChange(e.target.value)} />
        </div>

        <div className="field">
          <label htmlFor="slug">Slug</label>
          <input
            id="slug"
            className="input"
            required
            value={form.slug}
            onChange={(e) => {
              setSlugTouched(true)
              handleChange('slug', e.target.value)
            }}
          />
        </div>

        <div className="field">
          <label htmlFor="description">Descrição</label>
          <textarea
            id="description"
            className="input"
            required
            rows={4}
            value={form.description}
            onChange={(e) => handleChange('description', e.target.value)}
          />
        </div>

        <div className="admin-form__row">
          <div className="field">
            <label htmlFor="price">Preço (€)</label>
            <input
              id="price"
              className="input"
              type="number"
              step="0.01"
              min="0.01"
              required
              value={form.price}
              onChange={(e) => handleChange('price', e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="stock">Stock</label>
            <input
              id="stock"
              className="input"
              type="number"
              min="0"
              required
              value={form.stock}
              onChange={(e) => handleChange('stock', e.target.value)}
            />
          </div>
        </div>

        <div className="admin-form__row">
          <div className="field">
            <label htmlFor="brand">Marca</label>
            <input
              id="brand"
              className="input"
              value={form.brand}
              onChange={(e) => handleChange('brand', e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="model">Modelo</label>
            <input
              id="model"
              className="input"
              value={form.model}
              onChange={(e) => handleChange('model', e.target.value)}
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="colors">Cores disponíveis (separadas por vírgula)</label>
          <input
            id="colors"
            className="input"
            placeholder="Preto, Branco, Azul"
            value={form.colors}
            onChange={(e) => handleChange('colors', e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="category">Categoria</label>
          <select id="category" required value={form.categoryId} onChange={(e) => handleChange('categoryId', e.target.value)}>
            <option value="" disabled>Escolhe uma categoria</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <label className="admin-form__checkbox">
          <input
            type="checkbox"
            checked={form.featured}
            onChange={(e) => handleChange('featured', e.target.checked)}
          />
          Produto em destaque (aparece na homepage)
        </label>

        {error && <p className="form-alert" role="alert">{error}</p>}

        <button type="submit" className="btn" disabled={submitting}>
          {submitting ? 'A guardar...' : isEditing ? 'Guardar alterações' : 'Criar produto'}
        </button>
      </form>

      {isEditing && (
        <div className="admin-form__images">
          <h2>Imagens</h2>
          <ProductImageManager productId={productId} images={images} onImagesChange={setImages} />
        </div>
      )}
      {!isEditing && (
        <p style={{ color: 'var(--color-ink-soft)', marginTop: 24 }}>
          Cria o produto primeiro — depois disso podes adicionar as imagens aqui mesmo.
        </p>
      )}
    </div>
  )
}
