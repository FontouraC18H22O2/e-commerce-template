import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '../services/api.js'
import { useCart } from '../context/CartContext.jsx'
import { formatPrice } from '../utils/format.js'
import ProductGallery from '../components/ProductGallery.jsx'
import RelatedProducts from '../components/RelatedProducts.jsx'

export default function ProductDetail() {
  const { slug } = useParams()
  const { addItem } = useCart()

  const [product, setProduct] = useState(null)
  const [relatedProducts, setRelatedProducts] = useState([])
  const [quantity, setQuantity] = useState(1)
  const [notFound, setNotFound] = useState(false)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    setProduct(null)
    setNotFound(false)
    setAdded(false)
    setQuantity(1)

    api
      .get(`/products/${slug}`)
      .then((data) => {
        setProduct(data.product)
        setRelatedProducts(data.relatedProducts)
      })
      .catch((err) => {
        if (err.status === 404) setNotFound(true)
      })
  }, [slug])

  if (notFound) {
    return (
      <div>
        <p>Produto não encontrado.</p>
        <Link to="/" className="btn--text">Voltar ao catálogo</Link>
      </div>
    )
  }

  if (!product) return <p style={{ color: 'var(--color-ink-soft)' }}>A carregar...</p>

  function handleAddToCart() {
    addItem(product, quantity)
    setAdded(true)
  }

  return (
    <div>
      <motion.div
        className="product-detail"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <ProductGallery images={product.images} name={product.name} />

        <div>
          <p className="product-detail__category">{product.category.name}</p>
          <h1>{product.name}</h1>

          <div className="price-row">
            <p className="product-detail__price">{formatPrice(product.priceCents)}</p>
            {product.compareAtPriceCents && (
              <span className="price-original">{formatPrice(product.compareAtPriceCents)}</span>
            )}
            {product.promotion && <span className="promo-badge">-{product.promotion.discountPercent}%</span>}
          </div>

          <p>{product.description}</p>

          {(product.brand || product.model || product.colors.length > 0) && (
            <dl className="product-detail__specs">
              {product.brand && (
                <div>
                  <dt>Marca</dt>
                  <dd>{product.brand}</dd>
                </div>
              )}
              {product.model && (
                <div>
                  <dt>Modelo</dt>
                  <dd>{product.model}</dd>
                </div>
              )}
              {product.colors.length > 0 && (
                <div>
                  <dt>Cores disponíveis</dt>
                  <dd>{product.colors.join(', ')}</dd>
                </div>
              )}
            </dl>
          )}

          {product.inStock ? (
            <p className="product-detail__stock">Em stock</p>
          ) : (
            <p className="form-alert" role="alert">Esgotado</p>
          )}

          <div className="product-detail__actions">
            <input
              className="input"
              type="number"
              min="1"
              max="99"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              disabled={!product.inStock}
            />
            <motion.button
              type="button"
              className="btn"
              onClick={handleAddToCart}
              disabled={!product.inStock}
              whileTap={{ scale: 0.96 }}
            >
              Adicionar ao carrinho
            </motion.button>
          </div>

          <AnimatePresence>
            {added && (
              <motion.p
                className="product-detail__added"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                Adicionado ao carrinho. <Link to="/cart" style={{ textDecoration: 'underline' }}>Ver carrinho</Link>
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <RelatedProducts products={relatedProducts} />
    </div>
  )
}
