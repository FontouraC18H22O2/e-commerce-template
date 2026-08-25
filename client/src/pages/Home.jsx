import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { api } from '../services/api.js'
import ProductCard from '../components/ProductCard.jsx'
import PromoBanner from '../components/PromoBanner.jsx'
import FeaturedSection from '../components/FeaturedSection.jsx'

const gridVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}

export default function Home() {
  const [searchParams] = useSearchParams()
  // category e search são controlados pela navbar (dropdown de categorias e
  // barra de pesquisa) e chegam aqui via querystring — esta página só lê.
  const category = searchParams.get('category') ?? ''
  const search = searchParams.get('search') ?? ''

  const [products, setProducts] = useState([])
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sort, setSort] = useState('newest')
  const [page, setPage] = useState(1)
  const [categoryName, setCategoryName] = useState('')

  useEffect(() => {
    if (!category) {
      setCategoryName('')
      return
    }
    api.get('/categories').then((data) => {
      const match = data.categories.find((c) => c.slug === category)
      setCategoryName(match?.name ?? category)
    })
  }, [category])

  // Sempre que a categoria/pesquisa mudam (navegação a partir da navbar),
  // a paginação volta ao início.
  useEffect(() => {
    setPage(1)
  }, [category, search])

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

  const showIntro = !category && !search

  return (
    <div className="home">
      {showIntro && (
        <>
          <PromoBanner />
          <FeaturedSection />
        </>
      )}

      <div className="home__filters">
        <div>
          <p className="eyebrow">{category ? 'Categoria' : search ? 'Pesquisa' : 'Catálogo'}</p>
          <h1 style={{ marginBottom: 0 }}>
            {category ? categoryName : search ? `Resultados para "${search}"` : 'Todos os produtos'}
          </h1>
        </div>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          style={{ marginLeft: 'auto' }}
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
