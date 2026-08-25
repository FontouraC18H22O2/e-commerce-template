import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { api } from '../services/api.js'
import ProductCard from '../components/ProductCard.jsx'
import { SearchIcon } from '../components/icons/index.jsx'

const gridVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}

export default function Home() {
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [sort, setSort] = useState('newest')
  const [page, setPage] = useState(1)

  useEffect(() => {
    api.get('/categories').then((data) => setCategories(data.categories))
  }, [])

  useEffect(() => {
    setLoading(true)
    setError(null)

    const params = new URLSearchParams({ sort, page: String(page) })
    if (search) params.set('search', search)
    if (category) params.set('category', category)

    api
      .get(`/products?${params.toString()}`)
      .then((data) => {
        setProducts(data.items)
        setPagination(data.pagination)
      })
      .catch(() => setError('Não foi possível carregar os produtos.'))
      .finally(() => setLoading(false))
  }, [search, category, sort, page])

  function handleSearchSubmit(e) {
    e.preventDefault()
    setPage(1)
    setSearch(e.target.elements.search.value.trim())
  }

  return (
    <div className="home">
      <motion.div
        className="home__intro"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <p className="eyebrow">Catálogo</p>
        <h1>Peças pensadas para durar</h1>
        <p style={{ color: 'var(--color-ink-soft)' }}>
          Uma seleção variada, do vestuário à tecnologia — sem barulho, só o essencial.
        </p>
      </motion.div>

      <div className="home__filters">
        <form onSubmit={handleSearchSubmit} className="home__search">
          <SearchIcon />
          <input name="search" type="search" placeholder="Pesquisar produtos..." defaultValue={search} />
        </form>

        <select
          value={category}
          onChange={(e) => {
            setPage(1)
            setCategory(e.target.value)
          }}
        >
          <option value="">Todas as categorias</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.slug}>
              {cat.name} ({cat._count.products})
            </option>
          ))}
        </select>

        <select
          value={sort}
          onChange={(e) => {
            setPage(1)
            setSort(e.target.value)
          }}
        >
          <option value="newest">Mais recentes</option>
          <option value="price_asc">Preço: mais baixo</option>
          <option value="price_desc">Preço: mais alto</option>
        </select>
      </div>

      {loading && <p style={{ color: 'var(--color-ink-soft)' }}>A carregar...</p>}
      {error && <p className="form-alert" role="alert">{error}</p>}

      {!loading && !error && products.length === 0 && <p className="home__empty">Nenhum produto encontrado.</p>}

      <motion.div className="home__grid" variants={gridVariants} initial="hidden" animate="show">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </motion.div>

      {pagination && pagination.totalPages > 1 && (
        <div className="home__pagination">
          <button type="button" className="btn--text" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Anterior
          </button>
          <span>
            {pagination.page} / {pagination.totalPages}
          </span>
          <button
            type="button"
            className="btn--text"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Seguinte
          </button>
        </div>
      )}
    </div>
  )
}
