import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '../services/api.js'
import { formatPrice } from '../utils/format.js'
import { SearchIcon } from './icons/index.jsx'

// Quantas sugestões mostrar no dropdown — o resto fica só acessível pelo
// "Ver todos os N resultados", para o dropdown nunca crescer sem limite à
// medida que o catálogo for tendo mais produtos.
const SUGGESTIONS_LIMIT = 6
const DEBOUNCE_MS = 300

export default function SearchBar() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('search') ?? '')
  const [results, setResults] = useState([])
  const [total, setTotal] = useState(0)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const containerRef = useRef(null)
  // Evita que a resposta de uma pesquisa antiga (mais lenta) substitua o
  // resultado de uma mais recente — só aceitamos a resposta do pedido mais
  // recente que disparámos.
  const requestIdRef = useRef(0)

  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length === 0) {
      setResults([])
      setOpen(false)
      return
    }

    const requestId = ++requestIdRef.current
    setLoading(true)

    const timeout = setTimeout(() => {
      const params = new URLSearchParams({ search: trimmed, limit: String(SUGGESTIONS_LIMIT), sort: 'newest', page: '1' })
      api
        .get(`/products?${params.toString()}`)
        .then((data) => {
          if (requestId !== requestIdRef.current) return
          setResults(data.items)
          setTotal(data.pagination.total)
          setOpen(true)
        })
        .finally(() => {
          if (requestId === requestIdRef.current) setLoading(false)
        })
    }, DEBOUNCE_MS)

    return () => clearTimeout(timeout)
  }, [query])

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function goToFullResults() {
    setOpen(false)
    navigate(query.trim() ? `/?search=${encodeURIComponent(query.trim())}` : '/')
  }

  function handleSubmit(e) {
    e.preventDefault()
    goToFullResults()
  }

  return (
    <div className="navbar__search-wrap" ref={containerRef}>
      <form onSubmit={handleSubmit} className="navbar__search">
        <SearchIcon />
        <input
          name="search"
          type="search"
          placeholder="Pesquisar..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setOpen(true)
          }}
        />
      </form>

      <AnimatePresence>
        {open && query.trim().length > 0 && (
          <motion.div
            className="search-suggestions"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
          >
            {loading && <p className="search-suggestions__empty">A procurar...</p>}

            {!loading && results.length === 0 && (
              <p className="search-suggestions__empty">Sem resultados para &quot;{query.trim()}&quot;.</p>
            )}

            {!loading &&
              results.map((product) => (
                <Link
                  key={product.id}
                  to={`/products/${product.slug}`}
                  className="search-suggestions__item"
                  onClick={() => setOpen(false)}
                >
                  <div className="search-suggestions__thumb">
                    {product.images?.[0] ? (
                      <img src={product.images[0].url} alt="" />
                    ) : (
                      <div className="product-card__placeholder" />
                    )}
                  </div>
                  <div>
                    <p className="search-suggestions__name">{product.name}</p>
                    <p className="search-suggestions__price">{formatPrice(product.priceCents)}</p>
                  </div>
                </Link>
              ))}

            {!loading && total > results.length && (
              <button type="button" className="search-suggestions__more" onClick={goToFullResults}>
                Ver todos os {total} resultados
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
